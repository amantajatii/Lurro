// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ProjectVault} from "../src/ProjectVault.sol";
import {VaultFixture} from "./ProjectVault.t.sol";

/// @dev Adversarial token fixture only; the production vault pins Arc USDC.
contract CallbackToken is ERC20 {
    address private target;
    bytes private payload;
    bool public callbackSucceeded;
    bytes public callbackResult;

    constructor() ERC20("Callback fixture", "TEST") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function configure(address vault, bytes calldata data) external {
        target = vault;
        payload = data;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        bool result = super.transfer(to, amount);
        _callback();
        return result;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        bool result = super.transferFrom(from, to, amount);
        _callback();
        return result;
    }

    function _callback() private {
        address destination = target;
        if (destination == address(0)) return;
        target = address(0);
        (callbackSucceeded, callbackResult) = destination.call(payload);
    }
}

contract ParticipantWallet {
    address private immutable owner;

    constructor(address signer) {
        owner = signer;
    }

    function execute(address target, bytes calldata data) external {
        require(msg.sender == owner, "wallet owner only");
        (bool success, bytes memory result) = target.call(data);
        if (!success) assembly { revert(add(result, 32), mload(result)) }
    }
}

contract ProjectVaultSecurityTest is VaultFixture {
    function _callbackToken(bytes memory payload) private returns (CallbackToken callbackToken) {
        CallbackToken implementation = new CallbackToken();
        vm.etch(address(token), address(implementation).code);
        callbackToken = CallbackToken(address(token));
        callbackToken.configure(address(vault), payload);
    }

    function _assertBlocked(CallbackToken t) private view {
        assertFalse(t.callbackSucceeded());
        assertEq(t.callbackResult(), abi.encodeWithSelector(ReentrancyGuard.ReentrancyGuardReentrantCall.selector));
        _assertAccounting();
    }

    function testDepositBlocksCallbackReservationOfAlreadyAvailableFunds() public {
        _lock();
        _deposit(100e6);
        CallbackToken t = _callbackToken(abi.encodeCall(ProjectVault.reserveMilestone, (0)));
        uint64 version = vault.stateVersion();
        _deposit(100e6);
        _assertBlocked(t);
        assertEq(vault.reserved(), 0);
        assertEq(vault.available(), 200e6);
        assertEq(vault.stateVersion(), version + 1);
    }

    function testPayoutBlocksCallbackPayoutOfAnotherEarnedMilestone() public {
        _approved();
        _deposit(100e6);
        vault.reserveMilestone(1);
        vm.prank(R1);
        vault.submitEvidence(1, keccak256("second work"));
        vm.prank(VERIFIER);
        vault.approveEvidence(1, 1, keccak256("second work"));
        vm.warp(block.timestamp + 48 hours);
        CallbackToken t = _callbackToken(abi.encodeCall(ProjectVault.executePayout, (1)));
        uint64 version = vault.stateVersion();
        vault.executePayout(0);
        _assertBlocked(t);
        assertEq(vault.paid(), 100e6);
        assertEq(vault.reserved(), 100e6);
        assertEq(vault.stateVersion(), version + 1);
        vault.executePayout(1);
        assertEq(vault.paid(), 200e6);
        _assertAccounting();
    }

    function testRefundBlocksCallbackPayoutWithoutTakingEarnedFunds() public {
        _submitted();
        vm.warp(block.timestamp + 72 hours);
        vm.prank(FUNDER);
        vault.escalateReviewTimeout(0);
        vm.prank(PRIMARY);
        vault.resolveDispute(0, false);
        _deposit(100e6);
        vault.reserveMilestone(1);
        vm.prank(R1);
        vault.submitEvidence(1, keccak256("second work"));
        vm.prank(VERIFIER);
        vault.approveEvidence(1, 1, keccak256("second work"));
        vm.warp(block.timestamp + 48 hours);
        CallbackToken t = _callbackToken(abi.encodeCall(ProjectVault.executePayout, (1)));
        vault.claimRefund();
        _assertBlocked(t);
        assertEq(vault.refunded(), 100e6);
        assertEq(vault.paid(), 0);
        assertEq(vault.reserved(), 100e6);
        vault.executePayout(1);
        _assertAccounting();
    }

    function testContractWalletCanAcceptSubmitAndReceiveAtSameAddress() public {
        ParticipantWallet wallet = new ParticipantWallet(address(this));
        ProjectVault.ProjectTerms memory terms = _terms();
        terms.recipients[0] = R2;
        terms.recipients[1] = address(wallet);
        assertGt(uint160(address(wallet)), uint160(R2));
        for (uint256 i; i < 2; ++i) {
            terms.milestones[i].submitter = address(wallet);
            terms.milestones[i].recipientAmounts[0] = 40e6;
            terms.milestones[i].recipientAmounts[1] = 60e6;
        }
        vault = _deploy(terms);
        bytes32 hash = vault.termsHash();
        address[5] memory roles = [FUNDER, R2, VERIFIER, PRIMARY, BACKUP];
        for (uint256 i; i < 5; ++i) {
            vm.prank(roles[i]);
            vault.acceptAgreement(hash);
        }
        wallet.execute(address(vault), abi.encodeCall(ProjectVault.acceptAgreement, (hash)));
        vault.lockAgreement();
        vm.prank(FUNDER);
        token.approve(address(vault), 100e6);
        _deposit(100e6);
        vault.reserveMilestone(0);
        wallet.execute(address(vault), abi.encodeCall(ProjectVault.submitEvidence, (0, keccak256("wallet evidence"))));
        vm.prank(VERIFIER);
        vault.approveEvidence(0, 1, keccak256("wallet evidence"));
        vm.warp(block.timestamp + 48 hours);
        vault.executePayout(0);
        assertEq(token.balanceOf(address(wallet)), 60e6);
        assertEq(token.balanceOf(R2), 40e6);
        _assertAccounting();
    }

    function testSupersededProposalCannotUsePreviouslyCollectedApprovals() public {
        _lock();
        _deposit(100e6);
        uint256 oldId = _cancelApproval();
        vm.prank(FUNDER);
        uint256 newId = vault.createCancellationProposal();
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.executeEarlyCancellation(oldId);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.executeEarlyCancellation(newId);
        vm.prank(R1);
        vault.approveCancellationProposal(newId);
        vm.prank(R2);
        vault.approveCancellationProposal(newId);
        vault.executeEarlyCancellation(newId);
        vault.claimRefund();
        _assertAccounting();
    }

    function testDisputeFreezesOnlyTargetMilestone() public {
        _approved();
        _deposit(100e6);
        vault.reserveMilestone(1);
        vm.prank(R1);
        vault.submitEvidence(1, keccak256("second"));
        vm.prank(VERIFIER);
        vault.approveEvidence(1, 1, keccak256("second"));
        vm.prank(FUNDER);
        vault.challengeApproval(0);
        vm.warp(block.timestamp + 48 hours);
        vault.executePayout(1);
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.executePayout(0);
        assertEq(vault.paid(), 100e6);
        assertEq(vault.reserved(), 100e6);
        _assertAccounting();
    }

    function testUnauthorizedArbiterCannotChooseRefund() public {
        _approved();
        vm.prank(FUNDER);
        vault.challengeApproval(0);
        vm.prank(FUNDER);
        vm.expectRevert(ProjectVault.Unauthorized.selector);
        vault.resolveDispute(0, false);
        vm.prank(R1);
        vm.expectRevert(ProjectVault.Unauthorized.selector);
        vault.resolveDispute(0, false);
        assertEq(vault.refundOwed(), 0);
        assertEq(vault.reserved(), 100e6);
        _assertAccounting();
    }
}
