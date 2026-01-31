// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script, console } from "forge-std/Script.sol";
import { EventRegistry } from "../src/EventRegistry.sol";
import { RsvpEscrow } from "../src/RsvpEscrow.sol";

contract DeployScript is Script {
    function run() external returns (EventRegistry registry, RsvpEscrow escrow) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        registry = new EventRegistry();
        escrow = new RsvpEscrow(address(registry));
        registry.setEscrow(address(escrow));

        vm.stopBroadcast();

        console.log("EventRegistry:", address(registry));
        console.log("RsvpEscrow:", address(escrow));
    }
}
