"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  EVENT_REGISTRY_ADDRESS,
  RSVP_ESCROW_ADDRESS,
  EVENT_REGISTRY_ABI,
  RSVP_ESCROW_ABI,
  type EventData,
} from "../../../lib/contracts";
import { formatEth, formatAddress, formatDate } from "../../../lib/utils";
import { useToast } from "../../../components/ui/toaster";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { config } from "../../../lib/wagmi";
import { Calendar, Users, Wallet, Gift, CheckCircle, XCircle } from "lucide-react";

export default function EventPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const eventId = id ? BigInt(id) : undefined;
  const { address } = useAccount();
  const { addToast } = useToast();
  const publicClient = usePublicClient({ config });
  const [checkInAddress, setCheckInAddress] = useState("");
  const [activityLog, setActivityLog] = useState<Array<{ type: string; msg: string; time?: string }>>([]);

  const { data: ev, refetch: refetchEvent } = useReadContract({
    address: EVENT_REGISTRY_ADDRESS,
    abi: EVENT_REGISTRY_ABI,
    functionName: "getEvent",
    args: eventId !== undefined ? [eventId] : undefined,
  });

  const { data: attendeeState } = useReadContract({
    address: RSVP_ESCROW_ADDRESS,
    abi: RSVP_ESCROW_ABI,
    functionName: "attendees",
    args: eventId !== undefined && address ? [eventId, address] : undefined,
  });

  const { writeContract: writeRsvp, data: rsvpHash, isPending: rsvpPending } = useWriteContract();
  const { writeContract: writeCheckIn, data: checkInHash, isPending: checkInPending } = useWriteContract();
  const { writeContract: writeClaimRefund, data: claimHash, isPending: claimPending } = useWriteContract();
  const { writeContract: writeFinalize, data: finalizeHash, isPending: finalizePending } = useWriteContract();

  useWaitForTransactionReceipt({ hash: rsvpHash, onSuccess: () => { refetchEvent(); addToast({ title: "RSVP confirmed", variant: "success" }); } });
  useWaitForTransactionReceipt({ hash: checkInHash, onSuccess: () => { refetchEvent(); addToast({ title: "Attendee checked in", variant: "success" }); } });
  useWaitForTransactionReceipt({ hash: claimHash, onSuccess: () => { refetchEvent(); addToast({ title: "Refund claimed", variant: "success" }); } });
  useWaitForTransactionReceipt({ hash: finalizeHash, onSuccess: () => { refetchEvent(); addToast({ title: "Event finalized", variant: "success" }); } });

  const now = BigInt(Math.floor(Date.now() / 1000));
  const event = ev as EventData | undefined;
  const isOrganizer = address && event && event.organizer.toLowerCase() === address.toLowerCase();
  const rsvpOpen = event && now < event.rsvpDeadline;
  const checkInOpen = event && now >= event.checkinStart && now <= event.checkinEnd;
  const refundable = event && now > event.checkinEnd;
  const canRsvp = event && rsvpOpen && attendeeState && !attendeeState[0];
  const canClaimRefund = event && refundable && attendeeState && attendeeState[1] && !attendeeState[2];
  const canFinalize = event && isOrganizer && refundable && !event.finalized;

  useEffect(() => {
    if (!publicClient || !RSVP_ESCROW_ADDRESS || eventId === undefined) return;
    const escrow = RSVP_ESCROW_ADDRESS;
    const run = async () => {
      try {
        const logs = await publicClient.getLogs({
          address: escrow,
          fromBlock: 0n,
          toBlock: "latest",
        });
        const items: Array<{ type: string; msg: string }> = [];
        for (const log of logs) {
          if (log.topics[1] && BigInt(log.topics[1]) === eventId) {
            const addr = log.topics[2];
            if (addr) {
              const hexAddr = "0x" + (addr.length >= 40 ? addr.slice(-40) : addr.padStart(40, "0"));
              items.push({ type: "Activity", msg: `${formatAddress(hexAddr)} — RSVP / check-in / refund` });
            } else items.push({ type: "Finalized", msg: "Event finalized" });
          }
        }
        setActivityLog(items.reverse().slice(-20));
      } catch {
        setActivityLog([]);
      }
    };
    run();
  }, [publicClient, eventId]);

  const handleRsvp = () => {
    if (!event || !RSVP_ESCROW_ADDRESS) return;
    writeRsvp(
      {
        address: RSVP_ESCROW_ADDRESS,
        abi: RSVP_ESCROW_ABI,
        functionName: "rsvp",
        args: [eventId!],
        value: event.depositWei,
      },
      { onError: (e) => addToast({ title: "RSVP failed", description: e.message.slice(0, 80), variant: "error" }) }
    );
  };

  const handleCheckIn = () => {
    if (!event || !RSVP_ESCROW_ADDRESS || !checkInAddress) return;
    writeCheckIn(
      {
        address: RSVP_ESCROW_ADDRESS,
        abi: RSVP_ESCROW_ABI,
        functionName: "checkIn",
        args: [eventId!, checkInAddress as `0x${string}`],
      },
      {
        onError: (e) => addToast({ title: "Check-in failed", description: e.message.slice(0, 80), variant: "error" }),
        onSuccess: () => setCheckInAddress(""),
      }
    );
  };

  const handleClaimRefund = () => {
    if (!RSVP_ESCROW_ADDRESS) return;
    writeClaimRefund(
      {
        address: RSVP_ESCROW_ADDRESS,
        abi: RSVP_ESCROW_ABI,
        functionName: "claimRefund",
        args: [eventId!],
      },
      { onError: (e) => addToast({ title: "Claim failed", description: e.message.slice(0, 80), variant: "error" }) }
    );
  };

  const handleFinalize = () => {
    if (!RSVP_ESCROW_ADDRESS) return;
    writeFinalize(
      {
        address: RSVP_ESCROW_ADDRESS,
        abi: RSVP_ESCROW_ABI,
        functionName: "finalize",
        args: [eventId!],
      },
      { onError: (e) => addToast({ title: "Finalize failed", description: e.message.slice(0, 80), variant: "error" }) }
    );
  };

  if (eventId === undefined || (ev === undefined && eventId !== undefined)) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-neutral-600">Loading event…</p>
        </div>
      </div>
    );
  }

  if (!event || (event as { organizer?: string }).organizer === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-neutral-600">Event not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <a href="/">Back home</a>
          </Button>
        </div>
      </div>
    );
  }

  const evt = event as EventData;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-50 py-8">
      <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Event #{String(eventId)}</CardTitle>
              <CardDescription className="mt-1">
                Deposit: {formatEth(evt.depositWei)} ETH · Organizer: {formatAddress(evt.organizer)}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {rsvpOpen && <Badge variant="success">RSVP open</Badge>}
              {checkInOpen && <Badge variant="warning">Check-in open</Badge>}
              {refundable && !evt.finalized && <Badge variant="secondary">Refundable</Badge>}
              {evt.finalized && <Badge variant="muted">Finalized</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-neutral-500" />
                <span>RSVP deadline: {formatDate(evt.rsvpDeadline)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-neutral-500" />
                <span>Check-in: {formatDate(evt.checkinStart)} – {formatDate(evt.checkinEnd)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-neutral-500" />
                <span>Beneficiary: {formatAddress(evt.beneficiary)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-500" />
                <span>RSVPs: {String(evt.rsvpCount)} · Checked in: {String(evt.checkinCount)}</span>
              </div>
            </div>

            {address && (
              <div className="rounded-xl bg-neutral-100 p-3 text-sm">
                <strong>Your status:</strong>{" "}
                {attendeeState?.[0] ? "RSVPed" : "Not RSVPed"}
                {attendeeState?.[1] ? " · Checked in" : ""}
                {attendeeState?.[2] ? " · Refunded" : ""}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {canRsvp && (
                <Button onClick={handleRsvp} disabled={rsvpPending}>
                  {rsvpPending ? "Confirming…" : `RSVP (${formatEth(evt.depositWei)} ETH)`}
                </Button>
              )}
              {canClaimRefund && (
                <Button variant="secondary" onClick={handleClaimRefund} disabled={claimPending}>
                  {claimPending ? "Claiming…" : "Claim refund"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isOrganizer && (
          <Card>
            <CardHeader>
              <CardTitle>Organizer actions</CardTitle>
              <CardDescription>Check in attendees or finalize the event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkInOpen && (
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder="Attendee address (0x…)"
                    value={checkInAddress}
                    onChange={(e) => setCheckInAddress(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button onClick={handleCheckIn} disabled={checkInPending || !checkInAddress}>
                    {checkInPending ? "Confirming…" : "Check in"}
                  </Button>
                </div>
              )}
              {canFinalize && (
                <Button variant="outline" onClick={handleFinalize} disabled={finalizePending}>
                  {finalizePending ? "Finalizing…" : "Finalize (send forfeits to beneficiary)"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Recent on-chain events for this event.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-neutral-600">
              {activityLog.length === 0 && <li>No activity yet.</li>}
              {activityLog.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{item.type}</Badge>
                  {item.msg}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
