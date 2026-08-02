import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase">
            Reset Abenza
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Acceso de edición
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            El dashboard es público. Solo tú puedes iniciar sesión para
            registrar o editar datos.
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-zinc-500">Cargando…</p>}>
          <LoginForm />
        </Suspense>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/" className="text-emerald-800 hover:underline">
            Ver dashboard sin entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
