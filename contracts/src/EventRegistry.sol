// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EventRegistry {
    address public owner;
    address public escrow;

    modifier onlyEscrow() {
        require(msg.sender == escrow, "Only escrow");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setEscrow(address _escrow) external {
        require(msg.sender == owner, "Only owner");
        require(escrow == address(0), "Escrow already set");
        escrow = _escrow;
    }

    struct Event {
        address organizer;
        uint256 depositWei;
        uint64 rsvpDeadline;
        uint64 checkinStart;
        uint64 checkinEnd;
        address beneficiary;
        bool finalized;
        uint256 rsvpCount;
        uint256 checkinCount;
    }

    mapping(uint256 => Event) public events;
    uint256 public nextEventId;

    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        uint256 depositWei,
        uint64 rsvpDeadline,
        uint64 checkinStart,
        uint64 checkinEnd,
        address beneficiary
    );

    function createEvent(
        uint256 depositWei,
        uint64 rsvpDeadline,
        uint64 checkinStart,
        uint64 checkinEnd,
        address beneficiary
    ) external returns (uint256 eventId) {
        require(rsvpDeadline > block.timestamp, "RSVP deadline must be in future");
        require(checkinStart >= rsvpDeadline, "Check-in start must be >= RSVP deadline");
        require(checkinEnd > checkinStart, "Check-in end must be after start");
        require(beneficiary != address(0), "Beneficiary required");

        eventId = nextEventId++;
        events[eventId] = Event({
            organizer: msg.sender,
            depositWei: depositWei,
            rsvpDeadline: rsvpDeadline,
            checkinStart: checkinStart,
            checkinEnd: checkinEnd,
            beneficiary: beneficiary,
            finalized: false,
            rsvpCount: 0,
            checkinCount: 0
        });

        emit EventCreated(eventId, msg.sender, depositWei, rsvpDeadline, checkinStart, checkinEnd, beneficiary);
    }

    function getEvent(uint256 eventId) external view returns (Event memory) {
        require(eventId < nextEventId, "Event does not exist");
        return events[eventId];
    }

    function incrementRsvpCount(uint256 eventId) external onlyEscrow {
        require(eventId < nextEventId, "Event does not exist");
        events[eventId].rsvpCount++;
    }

    function incrementCheckinCount(uint256 eventId) external onlyEscrow {
        require(eventId < nextEventId, "Event does not exist");
        events[eventId].checkinCount++;
    }

    function setFinalized(uint256 eventId) external onlyEscrow {
        require(eventId < nextEventId, "Event does not exist");
        events[eventId].finalized = true;
    }
}
