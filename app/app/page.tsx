"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Calendar, Wallet, Gift } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [eventId, setEventId] = useState("");

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-50">
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          RSVP escrow for reliable attendance
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-neutral-600">
          Create events with a deposit. Attendees who check in get their deposit back. No-shows fund a cause you choose.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link href="/create">Create event</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Event ID (e.g. 0)"
              className="w-32"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && eventId !== "" && router.push(`/event/${eventId}`)}
            />
            <Button
              variant="outline"
              size="lg"
              onClick={() => eventId !== "" && router.push(`/event/${eventId}`)}
              disabled={eventId === ""}
            >
              Open event
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
            How it works
          </h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            <div className="flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-medium text-neutral-900">1. Create & RSVP</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Organizers set deposit, deadlines, and a beneficiary. Attendees RSVP by sending the deposit (ETH).
              </p>
            </div>
            <div className="flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-medium text-neutral-900">2. Check-in</h3>
              <p className="mt-2 text-sm text-neutral-600">
                During the check-in window, the organizer marks who showed up. Only confirmed attendees get refunds.
              </p>
            </div>
            <div className="flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                <Gift className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-medium text-neutral-900">3. Refunds & finalize</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Checked-in attendees claim their deposit back. The organizer finalizes; forfeited deposits go to the beneficiary.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
