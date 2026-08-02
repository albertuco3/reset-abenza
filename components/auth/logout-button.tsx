"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
    >
      Salir
    </button>
  );
}
