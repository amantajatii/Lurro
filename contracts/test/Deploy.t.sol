// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {VaultFixture} from "./ProjectVault.t.sol";
import {ProjectVault} from "../src/ProjectVault.sol";
import {DeployProjectVault} from "../script/Deploy.s.sol";

contract DeployTest is VaultFixture {
    function testDeploymentReadsExactEncodedTermsWithoutAcceptingOrFunding() public {
        vm.writeFile("out/deploy-test-terms.hex", vm.toString(abi.encode(_terms())));
        vm.setEnv("LURRO_TERMS_FILE", "out/deploy-test-terms.hex");
        DeployProjectVault script = new DeployProjectVault();
        ProjectVault deployed = script.run();
        assertFalse(deployed.agreementLocked());
        assertEq(deployed.acceptanceCount(), 0);
        assertEq(deployed.deposited(), 0);
        assertEq(deployed.getTerms().funder, FUNDER);
        assertEq(
            deployed.termsHash(),
            keccak256(abi.encode(keccak256("LURRO_PROJECT_TERMS_V1_2"), block.chainid, address(deployed), _terms()))
        );
    }

    function testDeploymentScriptRejectsMainnet() public {
        DeployProjectVault script = new DeployProjectVault();
        vm.chainId(5042);
        vm.expectRevert("Arc Testnet only");
        script.run();
    }
}
