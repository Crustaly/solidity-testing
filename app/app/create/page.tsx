"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther, isAddress } from "viem";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import {
  EVENT_REGISTRY_ADDRESS,
  EVENT_REGISTRY_ABI,
} from "../../lib/contracts";
import { useToast } from "../../components/ui/toaster";

export default function CreatePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { addToast } = useToast();
  const [depositEth, setDepositEth] = useState("");
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [checkinStart, setCheckinStart] = useState("");
  const [checkinEnd, setCheckinEnd] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { data: nextId, refetch: refetchNextId } = useReadContract({
    address: EVENT_REGISTRY_ADDRESS,
    abi: EVENT_REGISTRY_ABI,
    functionName: "nextEventId",
  });
  const redirected = useRef(false);

  useEffect(() => {
    if (!isSuccess || redirected.current) return;
    redirected.current = true;
    refetchNextId().then(({ data }) => {
      if (data !== undefined && Number(data) > 0) {
        const eventId = Number(data) - 1;
        addToast({
          title: "Event created",
          description: `Redirecting to event #${eventId}`,
          variant: "success",
        });
        router.push(`/event/${eventId}`);
      }
    });
  }, [isSuccess, refetchNextId, router, addToast]);

  const validate = () => {
    const e: Record<string, string> = {};
    const dep = parseFloat(depositEth);
    if (isNaN(dep) || dep <= 0) e.depositEth = "Enter a positive deposit (ETH).";
    const now = Math.floor(Date.now() / 1000);
    const rsvpTs = Math.floor(new Date(rsvpDeadline).getTime() / 1000);
    const startTs = Math.floor(new Date(checkinStart).getTime() / 1000);
    const endTs = Math.floor(new Date(checkinEnd).getTime() / 1000);
    if (!rsvpDeadline || rsvpTs <= now) e.rsvpDeadline = "RSVP deadline must be in the future.";
    if (!checkinStart || startTs < rsvpTs) e.checkinStart = "Check-in start must be ≥ RSVP deadline.";
    if (!checkinEnd || endTs <= startTs) e.checkinEnd = "Check-in end must be after start.";
    if (!beneficiary || !isAddress(beneficiary)) e.beneficiary = "Enter a valid beneficiary address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!isConnected) {
      addToast({ title: "Connect your wallet", variant: "error" });
      return;
    }
    if (!EVENT_REGISTRY_ADDRESS) {
      addToast({ title: "Contracts not configured", description: "Set NEXT_PUBLIC_EVENT_REGISTRY_ADDRESS", variant: "error" });
      return;
    }
    if (!validate()) return;

    const depositWei = parseEther(depositEth);
    const rsvpDeadlineUnix = BigInt(Math.floor(new Date(rsvpDeadline).getTime() / 1000));
    const checkinStartUnix = BigInt(Math.floor(new Date(checkinStart).getTime() / 1000));
    const checkinEndUnix = BigInt(Math.floor(new Date(checkinEnd).getTime() / 1000));

    writeContract(
      {
        address: EVENT_REGISTRY_ADDRESS,
        abi: EVENT_REGISTRY_ABI,
        functionName: "createEvent",
        args: [depositWei, rsvpDeadlineUnix, checkinStartUnix, checkinEndUnix, beneficiary as `0x${string}`],
      },
      {
        onError: (err) => {
          addToast({ title: "Transaction failed", description: err.message.slice(0, 80), variant: "error" });
        },
      }
    );
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-50 py-12">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Create event</CardTitle>
            <CardDescription>
              Set deposit, deadlines, and beneficiary. Attendees RSVP with the deposit; checked-in attendees get refunds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Deposit (ETH)</label>
              <Input
                type="text"
                placeholder="0.001"
                value={depositEth}
                onChange={(e) => setDepositEth(e.target.value)}
                className={errors.depositEth ? "border-red-500" : ""}
              />
              {errors.depositEth && (
                <p className="mt-1 text-sm text-red-600">{errors.depositEth}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">RSVP deadline</label>
              <Input
                type="datetime-local"
                value={rsvpDeadline}
                onChange={(e) => setRsvpDeadline(e.target.value)}
                className={errors.rsvpDeadline ? "border-red-500" : ""}
              />
              {errors.rsvpDeadline && (
                <p className="mt-1 text-sm text-red-600">{errors.rsvpDeadline}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Check-in start</label>
              <Input
                type="datetime-local"
                value={checkinStart}
                onChange={(e) => setCheckinStart(e.target.value)}
                className={errors.checkinStart ? "border-red-500" : ""}
              />
              {errors.checkinStart && (
                <p className="mt-1 text-sm text-red-600">{errors.checkinStart}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Check-in end</label>
              <Input
                type="datetime-local"
                value={checkinEnd}
                onChange={(e) => setCheckinEnd(e.target.value)}
                className={errors.checkinEnd ? "border-red-500" : ""}
              />
              {errors.checkinEnd && (
                <p className="mt-1 text-sm text-red-600">{errors.checkinEnd}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Beneficiary address</label>
              <Input
                type="text"
                placeholder="0x…"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className={errors.beneficiary ? "border-red-500" : ""}
              />
              {errors.beneficiary && (
                <p className="mt-1 text-sm text-red-600">{errors.beneficiary}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={submit} disabled={isPending || isConfirming}>
                {isPending || isConfirming ? "Creating…" : "Create event"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
