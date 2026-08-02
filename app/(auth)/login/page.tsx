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
            Acceso privado
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Solo tú puedes entrar al dashboard.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
