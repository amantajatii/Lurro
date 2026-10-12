// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script} from "forge-std/Script.sol";
import {ProjectVault} from "../src/ProjectVault.sol";

/// @notice Testnet-only. Input is abi.encode(ProjectTerms), hex-encoded without whitespace.
contract DeployProjectVault is Script {
    function run() external returns (ProjectVault vault) {
        require(block.chainid == 5042002, "Arc Testnet only");
        bytes memory encoded = vm.parseBytes(vm.readFile(vm.envString("LURRO_TERMS_FILE")));
        ProjectVault.ProjectTerms memory terms = abi.decode(encoded, (ProjectVault.ProjectTerms));
        vm.startBroadcast(terms.funder);
        vault = new ProjectVault(terms);
        vm.stopBroadcast();
    }
}
