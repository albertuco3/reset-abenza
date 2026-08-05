import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { MindsetWrapper } from "@/components/motivation/mindset-wrapper";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-4">
            <p className="text-sm font-semibold tracking-tight text-zinc-900">
              Reset Abenza
            </p>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/" className="text-zinc-600 hover:text-zinc-900">
                Dashboard
              </Link>
              {user ? (
                <Link
                  href="/check-in"
                  className="text-zinc-600 hover:text-zinc-900"
                >
                  Check-in
                </Link>
              ) : null}
            </nav>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <MindsetWrapper autoCheckToday />
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-emerald-800 hover:underline"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
