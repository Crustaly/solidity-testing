# RSVP Escrow

![RSVP Escrow frontend demo](assets/frontend-demo.png)

MVP dApp on **Arbitrum Sepolia**: users RSVP to events by depositing ETH; the organizer marks check-ins; checked-in attendees claim refunds; no-shows’ deposits go to a beneficiary (e.g. social cause).

## Tech stack

- **Contracts**: Solidity + Foundry (forge)
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind + shadcn-style UI
- **Web3**: wagmi + viem
- **Network**: Arbitrum Sepolia (testnet)

## Repo structure

- `/contracts` — Foundry project (EventRegistry + RsvpEscrow)
- `/app` — Next.js app (Home, Create event, Event detail)

---

## Setup

### 1. Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Install contract dependencies (OpenZeppelin)

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
cd ..
```

### 3. Configure contracts env

```bash
cd contracts
cp .env.example .env
# Edit .env: set ARB_SEPOLIA_RPC_URL and PRIVATE_KEY (deployer, no 0x prefix)
```

Example `.env`:

```
ARB_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=your_private_key_here
```

### 4. Build and deploy contracts to Arbitrum Sepolia

```bash
cd contracts
forge build
forge script script/Deploy.s.sol --rpc-url $ARB_SEPOLIA_RPC_URL --broadcast
```

Note the printed addresses:

- `EventRegistry: 0x...`
- `RsvpEscrow: 0x...`

### 5. Configure frontend env

```bash
cd app
cp .env.example .env.local
# Paste EventRegistry and RsvpEscrow addresses from step 4
```

Example `app/.env.local`:

```
NEXT_PUBLIC_EVENT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_RSVP_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

### 6. Install frontend deps and run

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Connect a wallet on **Arbitrum Sepolia** (e.g. MetaMask).

---

## Demo script

End-to-end flow on Arbitrum Sepolia:

1. **Create event**  
   - Go to **Create event**.  
   - Fill: deposit (e.g. `0.001` ETH), RSVP deadline, check-in start/end (after RSVP deadline), beneficiary address.  
   - Submit. After tx confirms you’re redirected to `/event/[id]`.

2. **RSVP**  
   - With a **second wallet** (or same as organizer for testing), open the event page.  
   - Click **RSVP** and send the exact deposit (e.g. 0.001 ETH).  
   - Wait for confirmation.

3. **Check-in**  
   - As **organizer**, in “Organizer actions” enter the attendee’s address and click **Check in** (only valid during the check-in window).  
   - Confirm tx.

4. **Claim refund**  
   - After the **check-in end** time, as the **checked-in attendee**, click **Claim refund**.  
   - Confirm; the deposit is sent back.

5. **Finalize**  
   - As **organizer**, after check-in window has closed, click **Finalize**.  
   - Forfeited deposits (no-shows) are sent to the beneficiary.

---

## Contracts overview

- **EventRegistry**: `createEvent(depositWei, rsvpDeadline, checkinStart, checkinEnd, beneficiary)`; stores event params; only the linked RsvpEscrow can update counts/finalized.
- **RsvpEscrow**: `rsvp(eventId)` (payable), `checkIn(eventId, attendee)`, `claimRefund(eventId)`, `finalize(eventId)`; holds deposits; uses ReentrancyGuard and checks-effects-interactions.

---

## Notes

- No tests in this repo (per requirements).
- Organizer confirms check-in only (no biometrics).
- For local/dev, use Arbitrum Sepolia ETH from a faucet.
