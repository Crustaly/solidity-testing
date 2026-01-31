// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { EventRegistry } from "./EventRegistry.sol";

contract RsvpEscrow is ReentrancyGuard {
    EventRegistry public immutable registry;

    struct AttendeeState {
        bool hasRsvped;
        bool checkedIn;
        bool refunded;
    }

    // eventId => attendee => state
    mapping(uint256 => mapping(address => AttendeeState)) public attendees;

    event Rsvped(uint256 indexed eventId, address indexed attendee, uint256 amount);
    event CheckedIn(uint256 indexed eventId, address indexed attendee);
    event Refunded(uint256 indexed eventId, address indexed attendee, uint256 amount);
    event Finalized(uint256 indexed eventId, address beneficiary, uint256 amount);

    constructor(address _registry) {
        require(_registry != address(0), "Registry required");
        registry = EventRegistry(payable(_registry));
    }

    function rsvp(uint256 eventId) external payable nonReentrant {
        EventRegistry.Event memory ev = registry.getEvent(eventId);
        require(ev.organizer != address(0), "Event does not exist");
        require(block.timestamp < ev.rsvpDeadline, "RSVP deadline passed");
        require(msg.value == ev.depositWei, "Wrong deposit amount");
        require(!attendees[eventId][msg.sender].hasRsvped, "Already RSVPed");

        attendees[eventId][msg.sender].hasRsvped = true;
        registry.incrementRsvpCount(eventId);

        emit Rsvped(eventId, msg.sender, msg.value);
    }

    function checkIn(uint256 eventId, address attendee) external {
        EventRegistry.Event memory ev = registry.getEvent(eventId);
        require(msg.sender == ev.organizer, "Only organizer");
        require(block.timestamp >= ev.checkinStart && block.timestamp <= ev.checkinEnd, "Outside check-in window");
        require(attendees[eventId][attendee].hasRsvped, "Not RSVPed");
        require(!attendees[eventId][attendee].checkedIn, "Already checked in");

        attendees[eventId][attendee].checkedIn = true;
        registry.incrementCheckinCount(eventId);

        emit CheckedIn(eventId, attendee);
    }

    function claimRefund(uint256 eventId) external nonReentrant {
        EventRegistry.Event memory ev = registry.getEvent(eventId);
        require(block.timestamp > ev.checkinEnd, "Check-in window not closed");
        require(attendees[eventId][msg.sender].checkedIn, "Not checked in");
        require(!attendees[eventId][msg.sender].refunded, "Already refunded");

        attendees[eventId][msg.sender].refunded = true;
        uint256 amount = ev.depositWei;

        (bool ok, ) = msg.sender.call{ value: amount }("");
        require(ok, "Transfer failed");

        emit Refunded(eventId, msg.sender, amount);
    }

    function finalize(uint256 eventId) external nonReentrant {
        EventRegistry.Event memory ev = registry.getEvent(eventId);
        require(msg.sender == ev.organizer, "Only organizer");
        require(block.timestamp > ev.checkinEnd, "Check-in window not closed");
        require(!ev.finalized, "Already finalized");

        registry.setFinalized(eventId);
        // Forfeited amount = no-shows (RSVPed but not checked in) * deposit
        uint256 forfeited = (ev.rsvpCount - ev.checkinCount) * ev.depositWei;
        if (forfeited > 0) {
            (bool ok, ) = ev.beneficiary.call{ value: forfeited }("");
            require(ok, "Transfer failed");
        }

        emit Finalized(eventId, ev.beneficiary, forfeited);
    }

    receive() external payable {}
}
