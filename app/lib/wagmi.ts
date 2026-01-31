import { http, createConfig } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [arbitrumSepolia.id]: http(
      process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc"
    ),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
