// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";
import {ProjectVault} from "../src/ProjectVault.sol";
import {VaultFixture, TestUSDC} from "./ProjectVault.t.sol";

contract VaultHandler is Test {
    ProjectVault public vault;
    TestUSDC public token;
    uint256 public ghostDeposited;
    uint256 public ghostPaid;
    uint256 public ghostRefunded;
    uint256 public ghostDonated;
    uint256 public successfulActions;
    uint256 public completedPayments;
    uint256 public completedRefunds;
    uint64 public ghostVersion = 1;
    bytes32 private initialHash;
    address private constant FUNDER = address(0x100);
    address private constant R1 = address(0x200);
    address private constant R2 = address(0x300);
    address private constant VERIFIER = address(0x400);
    address private constant PRIMARY = address(0x500);
    address private constant BACKUP = address(0x600);

    constructor(ProjectVault v, TestUSDC t) {
        vault = v;
        token = t;
        initialHash = v.termsHash();
    }

    function elapse(uint256 secondsSeed) external {
        vm.warp(block.timestamp + bound(secondsSeed, 1, 2 days));
    }

    function donate(uint256 amount) external {
        amount = bound(amount, 1, 100e6);
        token.mint(address(vault), amount);
        ghostDonated += amount;
    }

    function progress(uint256 idSeed, uint256 choice) external {
        uint256 id = idSeed % 2;
        ProjectVault.MilestoneState memory m = vault.getMilestone(id);
        ProjectVault.ProjectTerms memory terms = vault.getTerms();
        ProjectVault.Status s = vault.effectiveStatus(id);
        if (s == ProjectVault.Status.Planned) {
            if (block.timestamp >= terms.milestones[id].submissionDeadline) {
                vault.expireUnsubmitted(id);
                _advanced();
                return;
            }
            if (id == 1 && vault.getMilestone(0).status == ProjectVault.Status.Planned) return;
            uint256 need = 100e6;
            if (vault.available() < need) {
                uint256 amount = need - vault.available();
                amount = bound(choice, 1, amount);
                vm.prank(FUNDER);
                vault.deposit(amount);
                ghostDeposited += amount;
                _advanced();
                return;
            }
            vault.reserveMilestone(id);
            _advanced();
        } else if (s == ProjectVault.Status.Reserved) {
            if (block.timestamp >= terms.milestones[id].submissionDeadline) {
                vault.expireUnsubmitted(id);
                _advanced();
                return;
            }
            vm.prank(R1);
            vault.submitEvidence(id, keccak256(abi.encode(id, uint32(1))));
            _advanced();
        } else if (s == ProjectVault.Status.Submitted) {
            if (block.timestamp >= uint256(m.submittedAt) + 72 hours) {
                vm.prank(BACKUP);
                vault.escalateReviewTimeout(id);
            } else if (choice % 2 == 0) {
                vm.prank(VERIFIER);
                vault.approveEvidence(id, m.revision, m.evidenceHash);
            } else {
                vm.prank(VERIFIER);
                vault.rejectEvidence(id, m.revision, m.evidenceHash, keccak256("review reason"));
            }
            _advanced();
        } else if (s == ProjectVault.Status.Rejected) {
            if (block.timestamp >= vault.rejectionCloseAt(id)) {
                vault.finalizeRejection(id);
            } else if (
                choice % 2 == 0 && m.revision < 3 && block.timestamp < terms.milestones[id].finalEvidenceDeadline
            ) {
                vm.prank(R1);
                vault.resubmitEvidence(id, keccak256(abi.encode(id, m.revision + 1)));
            } else {
                vm.prank(R1);
                vault.challengeRejection(id);
            }
            _advanced();
        } else if (s == ProjectVault.Status.Approved) {
            vm.prank(FUNDER);
            vault.challengeApproval(id);
            _advanced();
        } else if (s == ProjectVault.Status.Disputed) {
            if (block.timestamp >= uint256(m.disputeOpenedAt) + 7 days) {
                vault.finalizeDefault(id);
            } else if (choice % 3 == 0) {
                return;
            } else {
                address arbiter = block.timestamp >= uint256(m.disputeOpenedAt) + 72 hours ? BACKUP : PRIMARY;
                vm.prank(arbiter);
                vault.resolveDispute(id, choice % 2 == 0);
            }
            _advanced();
        } else if (s == ProjectVault.Status.Claimable) {
            uint256 beforeBalance = token.balanceOf(R1) + token.balanceOf(R2);
            vault.executePayout(id);
            ghostPaid += token.balanceOf(R1) + token.balanceOf(R2) - beforeBalance;
            ++completedPayments;
            _advanced();
        }
    }

    function refund() external {
        if (vault.refundOwed() == 0) return;
        uint256 beforeBalance = token.balanceOf(FUNDER);
        vault.claimRefund();
        ghostRefunded += token.balanceOf(FUNDER) - beforeBalance;
        ++completedRefunds;
        _advanced();
    }

    function cancelFuture() external {
        if (successfulActions < 6 || vault.projectCancelled() || vault.activeUnpaidObligations() == 0) return;
        vm.prank(FUNDER);
        uint256 id = vault.createCancellationProposal();
        vm.prank(R1);
        vault.approveCancellationProposal(id);
        vm.prank(R2);
        vault.approveCancellationProposal(id);
        vault.executeEarlyCancellation(id);
        _advanced();
    }

    function failedPayout() external {
        for (uint256 id; id < 2; ++id) {
            if (vault.effectiveStatus(id) != ProjectVault.Status.Claimable) continue;
            token.setBlocked(R2);
            uint256 beforeBalance = token.balanceOf(R1);
            uint64 version = vault.stateVersion();
            vm.expectRevert("blocked");
            vault.executePayout(id);
            assertEq(token.balanceOf(R1), beforeBalance);
            assertEq(vault.stateVersion(), version);
            token.setBlocked(address(0));
        }
    }

    function _advanced() private {
        ++ghostVersion;
        ++successfulActions;
    }

    function assertIndependentLedger() external view {
        assertEq(vault.deposited(), ghostDeposited);
        assertEq(vault.paid(), ghostPaid);
        assertEq(vault.refunded(), ghostRefunded);
        assertEq(vault.stateVersion(), ghostVersion);
        assertEq(vault.termsHash(), initialHash);
        assertEq(token.balanceOf(address(vault)), ghostDeposited + ghostDonated - ghostPaid - ghostRefunded);
        assertEq(token.balanceOf(FUNDER), 10_000e6 - ghostDeposited + ghostRefunded);
        assertEq(token.balanceOf(R1) + token.balanceOf(R2), ghostPaid);
        assertLe(token.balanceOf(R1), 120e6);
        assertLe(token.balanceOf(R2), 80e6);
    }
}

contract ProjectVaultInvariantTest is StdInvariant, VaultFixture {
    VaultHandler internal handler;

    function setUp() public override {
        super.setUp();
        _lock();
        handler = new VaultHandler(vault, token);
        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = VaultHandler.progress.selector;
        selectors[1] = VaultHandler.elapse.selector;
        selectors[2] = VaultHandler.refund.selector;
        selectors[3] = VaultHandler.donate.selector;
        selectors[4] = VaultHandler.cancelFuture.selector;
        selectors[5] = VaultHandler.failedPayout.selector;
        targetSelector(FuzzSelector(address(handler), selectors));
        targetContract(address(handler));
    }

    function invariantAccountingAndImmutableDestinations() public view {
        _assertAccounting();
        handler.assertIndependentLedger();
        ProjectVault.ProjectTerms memory t = vault.getTerms();
        assertEq(t.funder, FUNDER);
        assertEq(t.recipients[0], R1);
        assertEq(t.recipients[1], R2);
        for (uint256 id; id < 2; ++id) {
            assertEq(t.milestones[id].recipientAmounts[0], 60e6);
            assertEq(t.milestones[id].recipientAmounts[1], 40e6);
        }
    }

    function testHandlerCompletesPayoutAndRefundWithoutReverts() public {
        handler.progress(0, 100e6);
        handler.progress(0, 0);
        handler.progress(0, 0);
        handler.progress(0, 0);
        handler.elapse(2 days);
        handler.progress(0, 0);
        handler.progress(1, 100e6);
        handler.progress(1, 0);
        handler.cancelFuture();
        handler.refund();
        assertEq(handler.completedPayments(), 1);
        assertEq(handler.completedRefunds(), 1);
        invariantAccountingAndImmutableDestinations();
    }

    function testHandlerExpiresReservedMilestoneWithoutSubmittingAgain() public {
        handler.progress(0, 100e6);
        handler.progress(0, 0);
        for (uint256 i; i < 5; ++i) {
            handler.elapse(2 days);
        }
        handler.progress(0, 0);
        handler.refund();
        assertEq(uint8(vault.effectiveStatus(0)), uint8(ProjectVault.Status.Cancelled));
        assertEq(handler.completedRefunds(), 1);
        invariantAccountingAndImmutableDestinations();
    }
}
