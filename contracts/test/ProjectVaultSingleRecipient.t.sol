// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {VaultFixture} from "./ProjectVault.t.sol";
import {ProjectVault} from "../src/ProjectVault.sol";

contract ProjectVaultSingleRecipientTest is VaultFixture {
    function _terms() internal view override returns (ProjectVault.ProjectTerms memory t) {
        t = super._terms();
        t.recipients = new address[](1);
        t.recipients[0] = R1;
        for (uint256 i; i < t.milestones.length; ++i) {
            t.milestones[i].recipientAmounts = new uint256[](1);
            t.milestones[i].recipientAmounts[0] = 100e6;
        }
    }

    function _lock() internal override {
        address[5] memory actors = [FUNDER, R1, VERIFIER, PRIMARY, BACKUP];
        bytes32 hash = vault.termsHash();
        for (uint256 i; i < actors.length; ++i) {
            vm.prank(actors[i]);
            vault.acceptAgreement(hash);
            if (i < 4) {
                vm.expectRevert(ProjectVault.InvalidState.selector);
                vault.lockAgreement();
            }
        }
        vault.lockAgreement();
        assertEq(vault.acceptanceCount(), 5);
    }

    function testSingleRecipientPayoutAndUnanimousCancellationRefund() public {
        _lock();
        _deposit(200e6);
        vault.reserveMilestone(0);
        vm.prank(R1);
        vault.submitEvidence(0, keccak256("single-recipient-work"));
        vm.prank(VERIFIER);
        vault.approveEvidence(0, 1, keccak256("single-recipient-work"));
        vm.warp(block.timestamp + 48 hours);
        vault.executePayout(0);
        assertEq(token.balanceOf(R1), 100e6);
        assertEq(token.balanceOf(R2), 0);
        vm.prank(FUNDER);
        uint256 proposal = vault.createCancellationProposal();
        vm.expectRevert(ProjectVault.InvalidState.selector);
        vault.executeEarlyCancellation(proposal);
        vm.prank(R1);
        vault.approveCancellationProposal(proposal);
        vault.executeEarlyCancellation(proposal);
        vault.claimRefund();
        assertEq(vault.paid(), 100e6);
        assertEq(vault.refunded(), 100e6);
        _assertAccounting();
    }

    function testRejectEmptyAndSixRecipients() public {
        ProjectVault.ProjectTerms memory t = _terms();
        t.recipients = new address[](0);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
        t.recipients = new address[](6);
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        _deploy(t);
    }
}
