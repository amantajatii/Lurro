// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ProjectVault} from "../src/ProjectVault.sol";

contract TestUSDC is ERC20 {
    address public blocked;
    bool public chargeFee;
    constructor() ERC20("Test USDC", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setBlocked(address account) external {
        blocked = account;
    }

    function setFee(bool enabled) external {
        chargeFee = enabled;
    }

    function _update(address from, address to, uint256 value) internal override {
        require(to != blocked || to == address(0), "blocked");
        if (chargeFee && from != address(0) && to != address(0) && value > 0) {
            super._update(from, address(0), 1);
            value -= 1;
        }
        super._update(from, to, value);
    }
}

contract VaultFixture is Test {
    ProjectVault internal vault;
    TestUSDC internal token;
    address internal constant FUNDER = address(0x100);
    address internal constant R1 = address(0x200);
    address internal constant R2 = address(0x300);
    address internal constant VERIFIER = address(0x400);
    address internal constant PRIMARY = address(0x500);
    address internal constant BACKUP = address(0x600);
    address internal constant OUTSIDER = address(0x700);
    uint64 internal deadline;

    function setUp() public virtual {
        vm.chainId(5042002);
        vm.warp(1_800_000_000);
        deadline = uint64(block.timestamp + 10 days);
        TestUSDC implementation = new TestUSDC();
        vm.etch(0x3600000000000000000000000000000000000000, address(implementation).code);
        token = TestUSDC(0x3600000000000000000000000000000000000000);
        vault = _deploy(_terms());
        token.mint(FUNDER, 10_000e6);
        vm.prank(FUNDER);
        token.approve(address(vault), type(uint256).max);
    }

    function _terms() internal view returns (ProjectVault.ProjectTerms memory t) {
        t.projectSalt = keccak256("test-project");
        t.signedDocumentHash = keccak256("exact signed document bytes");
        t.funder = FUNDER;
        t.usdcToken = address(token);
        t.verifier = VERIFIER;
        t.primaryArbiter = PRIMARY;
        t.backupArbiter = BACKUP;
        t.recipients = new address[](2);
        t.recipients[0] = R1;
        t.recipients[1] = R2;
        t.milestones = new ProjectVault.MilestoneTerms[](2);
        for (uint256 i; i < 2; ++i) {
            uint256[] memory amounts = new uint256[](2);
            amounts[0] = 60e6;
            amounts[1] = 40e6;
            uint64 due = deadline + uint64(i * 10 days);
            t.milestones[i] = ProjectVault.MilestoneTerms(R1, due, due + 7 days, keccak256(abi.encode(i)), amounts);
        }
        t.reviewPeriodSeconds = 72 hours;
        t.approvalChallengeSeconds = 48 hours;
        t.rejectionChallengeSeconds = 48 hours;
        t.backupDelaySeconds = 72 hours;
        t.arbitrationPeriodSeconds = 7 days;
        t.cancellationProposalSeconds = 7 days;
        t.maxEvidenceRevisions = 3;
    }

    function _deploy(ProjectVault.ProjectTerms memory t) internal returns (ProjectVault) {
        vm.prank(FUNDER);
        return new ProjectVault(t);
    }

    function _lock() internal {
        address[6] memory actors = [FUNDER, R1, R2, VERIFIER, PRIMARY, BACKUP];
        bytes32 hash = vault.termsHash();
        for (uint256 i; i < actors.length; ++i) {
            vm.prank(actors[i]);
            vault.acceptAgreement(hash);
        }
        vault.lockAgreement();
    }

    function _deposit(uint256 amount) internal {
        vm.prank(FUNDER);
        vault.deposit(amount);
    }

    function _submitted() internal {
        _lock();
        _deposit(100e6);
        vault.reserveMilestone(0);
        vm.prank(R1);
        vault.submitEvidence(0, keccak256("evidence-1"));
    }

    function _approved() internal {
        _submitted();
        vm.prank(VERIFIER);
        vault.approveEvidence(0, 1, keccak256("evidence-1"));
    }

    function _reject() internal {
        vm.prank(VERIFIER);
        vault.rejectEvidence(0, 1, keccak256("evidence-1"), keccak256("reason"));
    }

    function _cancelApproval() internal returns (uint256 id) {
        vm.prank(FUNDER);
        id = vault.createCancellationProposal();
        vm.prank(R1);
        vault.approveCancellationProposal(id);
        vm.prank(R2);
        vault.approveCancellationProposal(id);
    }

    function _assertAccounting() internal view {
        (uint256 d, uint256 a, uint256 r, uint256 q, uint256 p, uint256 f) = vault.getProjectAccounting();
        assertEq(d, a + r + q + p + f);
        assertGe(token.balanceOf(address(vault)), a + r + q);
        assertLe(a + r, vault.activeUnpaidObligations());
    }
}

contract ProjectVaultTest is VaultFixture {
    function testFundingRequiresExplicitAcceptanceOfEveryRole() public {
        vm.prank(FUNDER);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.deposit(1);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.lockAgreement();
        _lock();
        assertEq(vault.stateVersion(), 1);
        vm.prank(OUTSIDER);
        vm.expectRevert(ProjectVault.Unauthorized.selector);
        vault.deposit(1);
        _deposit(100e6);
        assertEq(vault.available(), 100e6);
        _assertAccounting();
    }

    function testAcceptanceRejectsWrongHashOutsiderAndReplay() public {
        bytes32 hash = vault.termsHash();
        vm.prank(FUNDER);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        vault.acceptAgreement(bytes32(uint256(1)));
        vm.prank(OUTSIDER);
        vm.expectRevert(ProjectVault.Unauthorized.selector);
        vault.acceptAgreement(hash);
        vm.prank(FUNDER);
        vault.acceptAgreement(hash);
        vm.prank(FUNDER);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.acceptAgreement(hash);
    }

    function testConstructorRejectsInvalidTerms() public {
        ProjectVault.ProjectTerms memory t = _terms();
        t.recipients[1] = R1;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.verifier = FUNDER;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.recipients[0] = address(0);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.milestones[0].submitter = OUTSIDER;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.milestones[0].recipientAmounts[0] = 0;
        t.milestones[1].recipientAmounts[0] = 0;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.milestones[1].submissionDeadline = deadline;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.milestones[0].finalEvidenceDeadline++;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.reviewPeriodSeconds++;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.fallbackPolicy = 1;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.cancellationPolicy = 1;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.usdcToken = OUTSIDER;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
    }

    function testFuzzRejectsUnsupportedRecoveryPolicy(uint8 policy) public {
        vm.assume(policy != 0);
        ProjectVault.ProjectTerms memory t = _terms();
        t.recoveryPolicy = policy;
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
    }

    function testFuzzReservationNeedsFullAmount(uint256 amount) public {
        amount = bound(amount, 1, 200e6);
        _lock();
        _deposit(amount);
        if (amount < 100e6) vm.expectRevert(ProjectVault.InsufficientFunding.selector);
        vault.reserveMilestone(0);
        assertEq(vault.reserved(), amount < 100e6 ? 0 : 100e6);
        _assertAccounting();
    }

    function testLaterReservationCannotBypassEarlierPlannedMilestone() public {
        _lock();
        _deposit(200e6);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.reserveMilestone(1);
        vault.reserveMilestone(0);
        vault.reserveMilestone(1);
        _assertAccounting();
    }

    function testFeeDepositRevertsAccountingAndTokenTransfer() public {
        _lock();
        token.setFee(true);
        uint256 beforeBalance = token.balanceOf(FUNDER);
        vm.prank(FUNDER);
        vm.expectRevert(ProjectVault.UnexpectedTransfer.selector);
        vault.deposit(100e6);
        assertEq(token.balanceOf(FUNDER), beforeBalance);
        assertEq(vault.deposited(), 0);
    }

    function testUnsolicitedTokensNeverBecomeProjectFunding() public {
        _lock();
        token.mint(address(vault), 50e6);
        assertEq(vault.available(), 0);
        vm.expectRevert(ProjectVault.InsufficientFunding.selector);
        vault.reserveMilestone(0);
        _deposit(100e6);
        _assertAccounting();
    }

    function testEvidenceRejectResubmitAndExactRevision() public {
        _submitted();
        vm.prank(OUTSIDER);
        vm.expectRevert(ProjectVault.Unauthorized.selector);
        vault.approveEvidence(0, 1, keccak256("evidence-1"));
        vm.prank(VERIFIER);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        vault.approveEvidence(0, 1, keccak256("wrong"));
        vm.prank(R1);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.resubmitEvidence(0, keccak256("evidence-2"));
        _reject();
        for (uint32 revision = 2; revision <= 3; ++revision) {
            bytes32 hash = keccak256(abi.encode(revision));
            vm.prank(R1);
            vault.resubmitEvidence(0, hash);
            vm.prank(VERIFIER);
            vm.expectRevert(ProjectVault.InvalidInput.selector);
            vault.approveEvidence(0, revision - 1, hash);
            vm.prank(VERIFIER);
            vault.rejectEvidence(0, revision, hash, keccak256("reason"));
        }
        vm.prank(R1);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.resubmitEvidence(0, keccak256("fourth"));
    }

    function testReviewTimeoutBoundaryAndParticipantAuthorization() public {
        _submitted();
        vm.prank(R1);
        vm.expectRevert(ProjectVault.DeadlineNotReached.selector);
        vault.escalateReviewTimeout(0);
        vm.warp(block.timestamp + 72 hours);
        vm.prank(VERIFIER);
        vm.expectRevert(ProjectVault.DeadlinePassed.selector);
        vault.approveEvidence(0, 1, keccak256("evidence-1"));
        vm.prank(VERIFIER);
        vm.expectRevert(ProjectVault.DeadlinePassed.selector);
        vault.rejectEvidence(0, 1, keccak256("evidence-1"), keccak256("reason"));
        vm.prank(OUTSIDER);
        vm.expectRevert(ProjectVault.Unauthorized.selector);
        vault.escalateReviewTimeout(0);
        vm.prank(BACKUP);
        vault.escalateReviewTimeout(0);
        assertEq(uint8(vault.effectiveStatus(0)), uint8(ProjectVault.Status.Disputed));
    }

    function testEarnedAtExactChallengeDeadlineWithoutFinalization() public {
        _approved();
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.executePayout(0);
        vm.warp(block.timestamp + 48 hours);
        assertEq(uint8(vault.effectiveStatus(0)), uint8(ProjectVault.Status.Claimable));
        vm.prank(FUNDER);
        vm.expectRevert(ProjectVault.DeadlinePassed.selector);
        vault.challengeApproval(0);
        vm.prank(R1);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.challengeRejection(0);
        vm.prank(PRIMARY);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.escalateReviewTimeout(0);
        uint256 id = _cancelApproval();
        vault.executeEarlyCancellation(id);
        assertEq(vault.reserved(), 100e6);
        vault.executePayout(0);
        assertEq(token.balanceOf(R1), 60e6);
        assertEq(token.balanceOf(R2), 40e6);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.executePayout(0);
        _assertAccounting();
    }

    function testChallengeJustBeforeDeadlineAndArbitrationBoundaries() public {
        _approved();
        vm.warp(block.timestamp + 48 hours - 1);
        vm.prank(R2);
        vault.challengeApproval(0);
        uint256 opened = block.timestamp;
        vm.prank(BACKUP);
        vm.expectRevert(ProjectVault.DeadlineNotReached.selector);
        vault.resolveDispute(0, true);
        vm.warp(opened + 72 hours);
        vm.prank(BACKUP);
        vault.resolveDispute(0, true);
        vault.executePayout(0);
        _assertAccounting();
    }

    function testArbitersLoseAuthorityAtDeadlineAndApprovedDefaultPays() public {
        _approved();
        vm.prank(FUNDER);
        vault.challengeApproval(0);
        vm.warp(block.timestamp + 7 days);
        vm.prank(PRIMARY);
        vm.expectRevert(ProjectVault.DeadlinePassed.selector);
        vault.resolveDispute(0, false);
        vm.prank(BACKUP);
        vm.expectRevert(ProjectVault.DeadlinePassed.selector);
        vault.resolveDispute(0, false);
        vault.finalizeDefault(0);
        vault.executePayout(0);
        _assertAccounting();
    }

    function testUnapprovedDefaultQueuesRefundAndFailurePreservesLiability() public {
        _submitted();
        vm.warp(block.timestamp + 72 hours);
        vm.prank(R1);
        vault.escalateReviewTimeout(0);
        vm.warp(block.timestamp + 7 days);
        vault.finalizeDefault(0);
        assertEq(vault.refundOwed(), 100e6);
        uint64 version = vault.stateVersion();
        token.setBlocked(FUNDER);
        vm.expectRevert("blocked");
        vault.claimRefund();
        assertEq(vault.refundOwed(), 100e6);
        assertEq(vault.stateVersion(), version);
        token.setBlocked(address(0));
        vault.claimRefund();
        assertEq(vault.refunded(), 100e6);
        _assertAccounting();
    }

    function testSecondRecipientFailureRollsBackWholePayout() public {
        _approved();
        vm.warp(block.timestamp + 48 hours);
        token.setBlocked(R2);
        uint64 version = vault.stateVersion();
        vm.expectRevert("blocked");
        vault.executePayout(0);
        assertEq(token.balanceOf(R1), 0);
        assertEq(vault.paid(), 0);
        assertEq(vault.reserved(), 100e6);
        assertEq(vault.stateVersion(), version);
        token.setBlocked(address(0));
        vault.executePayout(0);
        _assertAccounting();
    }

    function testEarlyCancellationRequiresUnanimousCurrentNonRevokedApprovals() public {
        _lock();
        _deposit(200e6);
        vault.reserveMilestone(0);
        uint64 version = vault.stateVersion();
        uint256 id = _cancelApproval();
        assertEq(vault.stateVersion(), version);
        vm.prank(R2);
        vault.revokeCancellationApproval(id);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.executeEarlyCancellation(id);
        vm.prank(R2);
        vault.approveCancellationProposal(id);
        vault.reserveMilestone(1);
        vm.expectRevert(ProjectVault.StaleProposal.selector);
        vault.executeEarlyCancellation(id);
        id = _cancelApproval();
        version = vault.stateVersion();
        vault.executeEarlyCancellation(id);
        assertEq(vault.stateVersion(), version + 1);
        assertEq(vault.refundOwed(), 200e6);
        assertEq(vault.reserved(), 0);
        vault.claimRefund();
        _assertAccounting();
    }

    function testEarlyCancellationKeepsRejectedMilestoneResubmittable() public {
        _submitted();
        _reject();
        uint256 id = _cancelApproval();
        vault.executeEarlyCancellation(id);
        vm.prank(R1);
        vault.resubmitEvidence(0, keccak256("new"));
        vm.prank(VERIFIER);
        vault.approveEvidence(0, 2, keccak256("new"));
        vm.warp(block.timestamp + 48 hours);
        vault.executePayout(0);
        _assertAccounting();
    }

    function testExpiryOnlyRefundsSurplusAndReservationCanSkipCancelledMilestone() public {
        _lock();
        _deposit(150e6);
        vm.warp(deadline);
        vault.expireUnsubmitted(0);
        assertEq(vault.available(), 100e6);
        assertEq(vault.refundOwed(), 50e6);
        vault.reserveMilestone(1);
        _assertAccounting();
    }

    function testReservedExpiryCanRefundThenFundRemainingMilestone() public {
        _lock();
        _deposit(100e6);
        vault.reserveMilestone(0);
        vm.warp(deadline);
        vault.expireUnsubmitted(0);
        vault.claimRefund();
        _deposit(100e6);
        vault.reserveMilestone(1);
        assertEq(vault.deposited(), 200e6);
        _assertAccounting();
    }

    function testRejectionClosesAtHardDeadlineAndRefunds() public {
        _submitted();
        _reject();
        vm.warp(deadline + 7 days);
        vm.prank(R1);
        vm.expectRevert(ProjectVault.DeadlinePassed.selector);
        vault.resubmitEvidence(0, keccak256("late"));
        vm.prank(R1);
        vm.expectRevert(ProjectVault.DeadlinePassed.selector);
        vault.challengeRejection(0);
        vault.finalizeRejection(0);
        assertEq(vault.refundOwed(), 100e6);
        _assertAccounting();
    }

    function testProposalExpiresAtEqualityAndNoStateVersionChange() public {
        _lock();
        uint256 id = _cancelApproval();
        vm.warp(block.timestamp + 7 days);
        vm.expectRevert(ProjectVault.DeadlinePassed.selector);
        vault.executeEarlyCancellation(id);
        assertEq(vault.stateVersion(), 1);
    }

    function testTermsHashBindsVaultAndChain() public {
        ProjectVault other = _deploy(_terms());
        assertNotEq(vault.termsHash(), other.termsHash());
        assertEq(
            vault.termsHash(),
            keccak256(abi.encode(keccak256("LURRO_PROJECT_TERMS_V1_2"), uint256(5042002), address(vault), _terms()))
        );
        vm.chainId(5042);
        other = _deploy(_terms());
        assertNotEq(vault.termsHash(), other.termsHash());
        vm.chainId(1);
        vm.expectRevert(ProjectVault.UnsupportedChain.selector);
        _deploy(_terms());
    }

    function testExportsIndependentTermsHashVector() public {
        vm.serializeString("hash-vector", "encodedTerms", vm.toString(abi.encode(_terms())));
        vm.serializeAddress("hash-vector", "vault", address(vault));
        vm.serializeUint("hash-vector", "chainId", block.chainid);
        string memory json = vm.serializeBytes32("hash-vector", "termsHash", vault.termsHash());
        vm.writeJson(json, "out/terms-hash-vector.json");
    }

    function testZeroAllocationCannotChallengeApprovalButCanEscalateTimeout() public {
        ProjectVault.ProjectTerms memory t = _terms();
        t.milestones[0].recipientAmounts[0] = 100e6;
        t.milestones[0].recipientAmounts[1] = 0;
        vault = _deploy(t);
        vm.prank(FUNDER);
        token.approve(address(vault), type(uint256).max);
        _approved();
        vm.prank(R2);
        vm.expectRevert(ProjectVault.Unauthorized.selector);
        vault.challengeApproval(0);
        vm.prank(R1);
        vault.challengeApproval(0);
        vm.prank(PRIMARY);
        vault.resolveDispute(0, true);
        token.setBlocked(R2);
        vault.executePayout(0);
        assertEq(token.balanceOf(R1), 100e6);
        assertEq(token.balanceOf(R2), 0);
        _deposit(100e6);
        vault.reserveMilestone(1);
        vm.prank(R1);
        vault.submitEvidence(1, keccak256("second"));
        vm.warp(block.timestamp + 72 hours);
        vm.prank(R2);
        vault.escalateReviewTimeout(1);
        _assertAccounting();
    }

    function testEveryParticipantCanEscalateButNoGenericDisputeExists() public {
        _submitted();
        vm.warp(block.timestamp + 72 hours);
        address[6] memory actors = [FUNDER, R1, R2, VERIFIER, PRIMARY, BACKUP];
        for (uint256 i; i < actors.length; ++i) {
            uint256 snapshot = vm.snapshotState();
            vm.prank(actors[i]);
            vault.escalateReviewTimeout(0);
            assertEq(uint8(vault.effectiveStatus(0)), uint8(ProjectVault.Status.Disputed));
            vm.revertToState(snapshot);
        }
        vm.prank(FUNDER);
        (bool success,) = address(vault).call(abi.encodeWithSignature("openDispute(uint256)", 0));
        assertFalse(success);
    }

    function testExactSubmissionDeadlineOnlyAllowsExpiry() public {
        _lock();
        _deposit(100e6);
        vault.reserveMilestone(0);
        vm.warp(deadline);
        vm.prank(R1);
        vm.expectRevert(ProjectVault.DeadlinePassed.selector);
        vault.submitEvidence(0, keccak256("late"));
        vault.expireUnsubmitted(0);
        assertEq(vault.refundOwed(), 100e6);
        _assertAccounting();
    }

    function testLateRejectionStillHasFull48HourChallengeWindow() public {
        _submitted();
        _reject();
        vm.warp(deadline + 7 days - 1);
        vm.prank(R1);
        vault.resubmitEvidence(0, keccak256("last-minute"));
        vm.warp(block.timestamp + 72 hours - 1);
        vm.prank(VERIFIER);
        vault.rejectEvidence(0, 2, keccak256("last-minute"), keccak256("reason"));
        uint256 close = block.timestamp + 48 hours;
        assertEq(vault.rejectionCloseAt(0), close);
        vm.warp(close - 1);
        vm.expectRevert(ProjectVault.DeadlineNotReached.selector);
        vault.finalizeRejection(0);
        vm.prank(R1);
        vault.challengeRejection(0);
        vm.prank(PRIMARY);
        vault.resolveDispute(0, true);
        vault.executePayout(0);
        _assertAccounting();
    }

    function testExhaustedRevisionClosesIn48HoursRatherThanHardDeadline() public {
        _submitted();
        _reject();
        for (uint32 revision = 2; revision <= 3; ++revision) {
            bytes32 hash = keccak256(abi.encode(revision));
            vm.prank(R1);
            vault.resubmitEvidence(0, hash);
            vm.prank(VERIFIER);
            vault.rejectEvidence(0, revision, hash, keccak256("reason"));
        }
        assertEq(vault.rejectionCloseAt(0), block.timestamp + 48 hours);
        vm.warp(block.timestamp + 48 hours);
        vm.prank(R1);
        vm.expectRevert(ProjectVault.DeadlinePassed.selector);
        vault.challengeRejection(0);
        vault.finalizeRejection(0);
        _assertAccounting();
    }

    function testCancellationCannotReclaimAnyInFlightMilestone() public {
        _approved();
        _deposit(100e6);
        vault.reserveMilestone(1);
        vm.prank(R1);
        vault.submitEvidence(1, keccak256("second"));
        uint256 id = _cancelApproval();
        vault.executeEarlyCancellation(id);
        assertEq(vault.refundOwed(), 0);
        assertEq(vault.reserved(), 200e6);
        vm.prank(VERIFIER);
        vault.approveEvidence(1, 1, keccak256("second"));
        vm.warp(block.timestamp + 48 hours);
        vault.executePayout(0);
        vault.executePayout(1);
        assertEq(vault.paid(), 200e6);
        _assertAccounting();
    }

    function testFinalizationInvalidatesProposalButTimeAloneDoesNot() public {
        _approved();
        uint256 id = _cancelApproval();
        uint64 version = vault.stateVersion();
        vm.warp(block.timestamp + 48 hours);
        assertEq(vault.stateVersion(), version);
        vault.finalizeApproval(0);
        assertEq(vault.stateVersion(), version + 1);
        vm.expectRevert(ProjectVault.StaleProposal.selector);
        vault.executeEarlyCancellation(id);
    }

    function testFeePayoutRevertsAllFinancialAndTokenEffects() public {
        _approved();
        vm.warp(block.timestamp + 48 hours);
        token.setFee(true);
        vm.expectRevert(ProjectVault.UnexpectedTransfer.selector);
        vault.executePayout(0);
        assertEq(token.balanceOf(R1), 0);
        assertEq(token.balanceOf(R2), 0);
        assertEq(vault.paid(), 0);
        _assertAccounting();
    }

    function testDepositCapExcludesQueuedRefundsAndPaidEntitlements() public {
        _lock();
        _deposit(200e6);
        vm.prank(FUNDER);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        vault.deposit(1);
        vm.warp(deadline);
        vault.expireUnsubmitted(0);
        assertEq(vault.refundOwed(), 100e6);
        vm.prank(FUNDER);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        vault.deposit(1);
        vault.reserveMilestone(1);
        vm.prank(R1);
        vault.submitEvidence(1, keccak256("second"));
        vm.prank(VERIFIER);
        vault.approveEvidence(1, 1, keccak256("second"));
        vm.warp(block.timestamp + 48 hours);
        vault.executePayout(1);
        vm.prank(FUNDER);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        vault.deposit(1);
        vault.claimRefund();
        _assertAccounting();
    }

    function testConstructorRejectsInvalidCountsAndAllRoleOverlaps() public {
        ProjectVault.ProjectTerms memory t;
        for (uint256 count; count <= 6; ++count) {
            if (count >= 2 && count <= 5) continue;
            t = _terms();
            t.recipients = new address[](count);
            vm.expectRevert(ProjectVault.InvalidInput.selector);
            _deploy(t);
        }
        t = _terms();
        t.milestones = new ProjectVault.MilestoneTerms[](0);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.milestones = new ProjectVault.MilestoneTerms[](4);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        address[5] memory invalidRoles = [address(0), FUNDER, R1, BACKUP, address(token)];
        for (uint256 i; i < invalidRoles.length; ++i) {
            t = _terms();
            t.verifier = invalidRoles[i];
            vm.expectRevert(ProjectVault.InvalidInput.selector);
            _deploy(t);
        }
        t = _terms();
        t.milestones[0].scopeHash = bytes32(0);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.milestones[0].submissionDeadline = uint64(block.timestamp);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t = _terms();
        t.milestones[0].recipientAmounts = new uint256[](1);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
    }

    function testFuzzRecipientSplitsPayExactly(uint256 a, uint256 b) public {
        a = bound(a, 1, 500e6);
        b = bound(b, 1, 500e6);
        ProjectVault.ProjectTerms memory t = _terms();
        t.milestones[0].recipientAmounts[0] = a;
        t.milestones[0].recipientAmounts[1] = b;
        vault = _deploy(t);
        vm.prank(FUNDER);
        token.approve(address(vault), type(uint256).max);
        _lock();
        _deposit(a + b);
        vault.reserveMilestone(0);
        vm.prank(R1);
        vault.submitEvidence(0, keccak256("split"));
        vm.prank(VERIFIER);
        vault.approveEvidence(0, 1, keccak256("split"));
        vm.warp(block.timestamp + 48 hours);
        vault.executePayout(0);
        assertEq(token.balanceOf(R1), a);
        assertEq(token.balanceOf(R2), b);
        _assertAccounting();
    }

    function testMaximumFiveRecipientsAndThreeMilestonesSettleExactly() public {
        ProjectVault.ProjectTerms memory t = _terms();
        t.recipients = new address[](5);
        for (uint256 i; i < 5; ++i) {
            t.recipients[i] = address(uint160(0x800 + i));
        }
        t.milestones = new ProjectVault.MilestoneTerms[](3);
        for (uint256 i; i < 3; ++i) {
            uint256[] memory amounts = new uint256[](5);
            for (uint256 j; j < 5; ++j) {
                amounts[j] = (j + 1) * 1e6;
            }
            uint64 due = deadline + uint64(i * 10 days);
            t.milestones[i] =
                ProjectVault.MilestoneTerms(t.recipients[0], due, due + 7 days, keccak256(abi.encode(i)), amounts);
        }
        vault = _deploy(t);
        bytes32 hash = vault.termsHash();
        address[4] memory roles = [FUNDER, VERIFIER, PRIMARY, BACKUP];
        for (uint256 i; i < 4; ++i) {
            vm.prank(roles[i]);
            vault.acceptAgreement(hash);
        }
        for (uint256 i; i < 5; ++i) {
            vm.prank(t.recipients[i]);
            vault.acceptAgreement(hash);
        }
        vault.lockAgreement();
        vm.prank(FUNDER);
        token.approve(address(vault), 45e6);
        _deposit(45e6);
        for (uint256 i; i < 3; ++i) {
            vault.reserveMilestone(i);
            vm.prank(t.recipients[0]);
            vault.submitEvidence(i, keccak256("work"));
            vm.prank(VERIFIER);
            vault.approveEvidence(i, 1, keccak256("work"));
        }
        vm.warp(block.timestamp + 48 hours);
        for (uint256 i; i < 3; ++i) {
            vault.executePayout(i);
        }
        for (uint256 i; i < 5; ++i) {
            assertEq(token.balanceOf(t.recipients[i]), (i + 1) * 3e6);
        }
        assertEq(vault.contractValue(), 45e6);
        assertEq(vault.paid(), 45e6);
        _assertAccounting();
    }

    function testFuzzChallengeDeadlineHasNoOverlap(uint256 elapsed) public {
        elapsed = bound(elapsed, 48 hours - 10, 48 hours + 10);
        _approved();
        vm.warp(block.timestamp + elapsed);
        if (elapsed < 48 hours) {
            vm.prank(FUNDER);
            vault.challengeApproval(0);
            vm.expectRevert(ProjectVault.InvalidState.selector);
            vault.executePayout(0);
        } else {
            vm.prank(FUNDER);
            vm.expectRevert(ProjectVault.DeadlinePassed.selector);
            vault.challengeApproval(0);
            vault.executePayout(0);
            assertEq(vault.paid(), 100e6);
        }
        _assertAccounting();
    }
}
