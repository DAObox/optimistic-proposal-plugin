import { useFetchDao, useFetchDaos } from "@daobox/use-aragon";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { type NextPage } from "next";
import Head from "next/head";
import config from "../test-config";
import { Address, useContractRead } from "wagmi";
import OptimisticProposalsABI from "~/abi/OptimisticProposalsABI";

const opConfig = {
  address: config.plugin as Address,
  abi: OptimisticProposalsABI,
};

const Home: NextPage = () => {
  useFetchDao({
    daoAddressOrEns: config.dao,
  });

  const { data: isMember, isSuccess } = useContractRead({
    ...opConfig,
    functionName: "isMember",
    args: ["0x47d80912400ef8f8224531EBEB1ce8f2ACf4b75a"],
  });

  const { data: permission } = useContractRead({
    ...opConfig,
    functionName: "RULE_PERMISSION_ID",
  });

  console.log("permission", permission);

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <div className="hero min-h-screen bg-base-200">
        <div className="mockup-code">
          <pre data-prefix="$">
            <code>npm i daisyui</code>
          </pre>
          {isSuccess && (
            <pre data-prefix="$">
              <code>isMember {String(isMember)}</code>
            </pre>
          )}
          {/* <TerminalLine text={permission} /> */}
          {/* <TerminalLine text={isMember?.toString()} /> */}
        </div>
      </div>
    </>
  );
};

export default Home;

const TerminalLine = (text: any | undefined) => {
  return <pre data-prefix="$">{text && <code>{text}</code>}</pre>;
};

const Navbar = () => {
  return (
    <div className="navbar justify-between bg-base-100 px-4">
      <a className="btn-ghost btn text-xl normal-case">daisyUI</a>
      <ConnectButton />
    </div>
  );
};