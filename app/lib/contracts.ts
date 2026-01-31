/**
 * Contract addresses (set via env after deployment).
 * Deploy with: cd contracts && forge script script/Deploy.s.sol --rpc-url $ARB_SEPOLIA_RPC_URL --broadcast
 */
export const EVENT_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_EVENT_REGISTRY_ADDRESS || "") as `0x${string}`;
export const RSVP_ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_RSVP_ESCROW_ADDRESS || "") as `0x${string}`;

export const EVENT_REGISTRY_ABI = [
  {
    type: "function",
    name: "createEvent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "depositWei", type: "uint256", internalType: "uint256" },
      { name: "rsvpDeadline", type: "uint64", internalType: "uint64" },
      { name: "checkinStart", type: "uint64", internalType: "uint64" },
      { name: "checkinEnd", type: "uint64", internalType: "uint64" },
      { name: "beneficiary", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "getEvent",
    stateMutability: "view",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        type: "tuple",
        internalType: "struct EventRegistry.Event",
        components: [
          { name: "organizer", type: "address", internalType: "address" },
          { name: "depositWei", type: "uint256", internalType: "uint256" },
          { name: "rsvpDeadline", type: "uint64", internalType: "uint64" },
          { name: "checkinStart", type: "uint64", internalType: "uint64" },
          { name: "checkinEnd", type: "uint64", internalType: "uint64" },
          { name: "beneficiary", type: "address", internalType: "address" },
          { name: "finalized", type: "bool", internalType: "bool" },
          { name: "rsvpCount", type: "uint256", internalType: "uint256" },
          { name: "checkinCount", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "nextEventId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "event",
    name: "EventCreated",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "organizer", type: "address", indexed: true, internalType: "address" },
      { name: "depositWei", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "rsvpDeadline", type: "uint64", indexed: false, internalType: "uint64" },
      { name: "checkinStart", type: "uint64", indexed: false, internalType: "uint64" },
      { name: "checkinEnd", type: "uint64", indexed: false, internalType: "uint64" },
      { name: "beneficiary", type: "address", indexed: false, internalType: "address" },
    ],
  },
] as const;

export const RSVP_ESCROW_ABI = [
  {
    type: "function",
    name: "rsvp",
    stateMutability: "payable",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "checkIn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "eventId", type: "uint256", internalType: "uint256" },
      { name: "attendee", type: "address", internalType: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimRefund",
    stateMutability: "nonpayable",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "finalize",
    stateMutability: "nonpayable",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "attendees",
    stateMutability: "view",
    inputs: [
      { name: "eventId", type: "uint256", internalType: "uint256" },
      { name: "attendee", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        type: "tuple",
        internalType: "struct RsvpEscrow.AttendeeState",
        components: [
          { name: "hasRsvped", type: "bool", internalType: "bool" },
          { name: "checkedIn", type: "bool", internalType: "bool" },
          { name: "refunded", type: "bool", internalType: "bool" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "Rsvped",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "attendee", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "CheckedIn",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "attendee", type: "address", indexed: true, internalType: "address" },
    ],
  },
  {
    type: "event",
    name: "Refunded",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "attendee", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Finalized",
    inputs: [
      { name: "eventId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "beneficiary", type: "address", indexed: false, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
] as const;

export type EventData = {
  organizer: `0x${string}`;
  depositWei: bigint;
  rsvpDeadline: bigint;
  checkinStart: bigint;
  checkinEnd: bigint;
  beneficiary: `0x${string}`;
  finalized: boolean;
  rsvpCount: bigint;
  checkinCount: bigint;
};
