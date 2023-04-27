import { AragonProvider } from "@daobox/use-aragon";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { type AppType } from "next/dist/shared/lib/utils";
import { WagmiConfig } from "wagmi";
import Layout from "~/components/Layout";
import { wagmiClient, chains } from "~/config-wagmi";
import { useIsMounted } from "~/hooks/write/useIsMounted";

import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  const mounted = useIsMounted();

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        <AragonProvider>
          {mounted && (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
        </AragonProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default MyApp;
