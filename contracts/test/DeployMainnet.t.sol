// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {VaultFixture} from "./ProjectVault.t.sol";
import {ProjectVault} from "../src/ProjectVault.sol";
import {DeployMainnetProjectVault} from "../script/DeployMainnet.s.sol";

contract DeployMainnetTest is VaultFixture {
    DeployMainnetProjectVault internal deployment;

    function configure() internal {
        deployment = new DeployMainnetProjectVault();
        vm.writeFile("out/mainnet-script-test.hex", vm.toString(abi.encode(_terms())));
    }

    function testRejectTestnetBeforeReadingSignerOrTerms() public {
        deployment = new DeployMainnetProjectVault();
        vm.expectRevert("Arc Mainnet only");
        deployment.run();
    }

    function testMainnetDeploymentGuardsAndNoImplicitFunds() public {
        configure();
        vm.chainId(5042);
        vm.expectRevert("Signer must be funder");
        deployment.run("out/mainnet-script-test.hex", OUTSIDER);
        ProjectVault.ProjectTerms memory terms = _terms();
        terms.usdcToken = OUTSIDER;
        vm.writeFile("out/mainnet-script-test.hex", vm.toString(abi.encode(terms)));
        vm.expectRevert("Unexpected USDC");
        deployment.run("out/mainnet-script-test.hex", FUNDER);
        terms = _terms();
        terms.verifier = FUNDER;
        vm.writeFile("out/mainnet-script-test.hex", vm.toString(abi.encode(terms)));
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        deployment.run("out/mainnet-script-test.hex", FUNDER);
        vm.stopBroadcast();
        terms = _terms();
        terms.recoveryPolicy = 1;
        vm.writeFile("out/mainnet-script-test.hex", vm.toString(abi.encode(terms)));
        vm.expectRevert(ProjectVault.InvalidInput.selector);
        deployment.run("out/mainnet-script-test.hex", FUNDER);
        vm.stopBroadcast();
        vm.writeFile("out/mainnet-script-test.hex", vm.toString(abi.encode(_terms())));
        ProjectVault created = deployment.run("out/mainnet-script-test.hex", FUNDER);
        assertEq(created.deploymentChainId(), 5042);
        assertEq(created.getTerms().funder, FUNDER);
        assertFalse(created.agreementLocked());
        assertEq(created.acceptanceCount(), 0);
        assertEq(created.deposited(), 0);
        assertEq(token.balanceOf(address(created)), 0);
        assertEq(token.allowance(FUNDER, address(created)), 0);
    }
}
