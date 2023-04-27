import { BN } from "~/hooks/op-helpers";
import { useNewOpProposal } from "~/hooks/write";

export function Main({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header title={title} />
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <body className="h-full">{children}</body>
        </div>
      </main>
    </>
  );
}

function NewProposalButton() {
  const { write, data, status, prepareStatus } = useNewOpProposal({
    metadata: "0x0000",
    allowFailureMap: BN(0),
    actions: [],
  });
  console.log({ data, status, prepareStatus });

  const handleWrite = async () => {
    console.log("write");
    write?.();
  };

  return (
    <button
      className="btn-secondary btn-active btn"
      onClick={() => handleWrite()}
    >
      click me
    </button>
  );
}

function Header({ title }: { title: string }) {
  return (
    <header className="bg-base-200 shadow">
      <div className="mx-auto flex max-w-7xl justify-between px-4 py-6  sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          {title}
        </h1>
        <NewProposalButton />
      </div>
    </header>
  );
}
