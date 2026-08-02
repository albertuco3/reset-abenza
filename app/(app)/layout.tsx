import { LogoutButton } from "@/components/auth/logout-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <p className="text-sm font-semibold tracking-tight text-zinc-900">
            Reset Abenza
          </p>
          <LogoutButton />
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
