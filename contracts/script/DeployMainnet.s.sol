// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script} from "forge-std/Script.sol";
import {ProjectVault} from "../src/ProjectVault.sol";

/// @notice Deployment only: never accepts, approves, deposits or reserves funds.
/// @dev Use an explicitly configured keystore/hardware signer matching LURRO_DEPLOYER.
contract DeployMainnetProjectVault is Script {
    function run() external returns (ProjectVault vault) {
        require(block.chainid == 5042, "Arc Mainnet only");
        address deployer = vm.envAddress("LURRO_DEPLOYER");
        require(deployer != address(0), "Configure deployment signer");
        bytes memory encoded = vm.parseBytes(vm.readFile(vm.envString("LURRO_TERMS_FILE")));
        ProjectVault.ProjectTerms memory terms = abi.decode(encoded, (ProjectVault.ProjectTerms));
        require(terms.funder == deployer, "Signer must be funder");
        require(terms.usdcToken == 0x3600000000000000000000000000000000000000, "Unexpected USDC");
        // Constructor validates policies, roles, allocations, token precision and deadlines.
        vm.startBroadcast(deployer);
        vault = new ProjectVault(terms);
        vm.stopBroadcast();
    }
}
