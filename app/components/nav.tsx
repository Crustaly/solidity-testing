"use client";

import Link from "next/link";
import { useConnect, useDisconnect, useAccount } from "wagmi";
import { Button } from "./ui/button";
import { formatAddress } from "../lib/utils";

export function Nav() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-neutral-900">
          RSVP Escrow
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/create" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Create event
          </Link>
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">{formatAddress(address)}</span>
              <Button variant="outline" size="sm" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => connect({ connector: connectors[0] })} disabled={isPending}>
              {isPending ? "Connecting…" : "Connect wallet"}
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
