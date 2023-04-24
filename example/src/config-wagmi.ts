import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { Chain, configureChains, createClient, goerli } from "wagmi";
import { mainnet, polygon, optimism, arbitrum } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

const devnetRpc =
  "https://rpc.vnet.tenderly.co/devnet/daobox-devnet/6e082a14-54ca-42cd-bb27-7013fff2b241";

export const devNet = {
  id: 43_114,
  name: "DevNet",
  network: "devnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    public: { http: [devnetRpc] },
    default: { http: [devnetRpc] },
  },
} as const satisfies Chain;

export const { chains, provider } = configureChains(
  [mainnet, polygon, goerli, devNet],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY! }),
    publicProvider(),
  ]
);

export const { connectors } = getDefaultWallets({
  appName: "Optimistic Proposals",
  projectId: "DAOBox",
  chains,
});

export const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});
