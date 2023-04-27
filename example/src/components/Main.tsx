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
function Header({ title }: { title: string }) {
  return (
    <header className="bg-base-200 shadow">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          {title}
        </h1>
      </div>
    </header>
  );
}
