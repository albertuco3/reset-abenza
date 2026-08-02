# Reset Abenza

Tracker personal privado para un año de reseteo físico y mental: hábitos, fuerza, EMOM, cardio y recuperación.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Auth + PostgreSQL + RLS)
- Recharts
- Vercel (deploy recomendado)

## Setup local

1. Clona el repo e instala dependencias:

```powershell
npm install
```

2. Copia variables de entorno:

```powershell
Copy-Item .env.local.example .env.local
```

Rellena:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_RESET_START_DATE` (inicio del año de reset, `YYYY-MM-DD`)

3. En Supabase SQL Editor, ejecuta `supabase/migrations/0001_init.sql`.

4. Crea tu usuario en **Authentication → Users** y desactiva nuevos sign-ups.

5. Arranca:

```powershell
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Datos de prueba (opcional)

`supabase/seed_demo.sql` — sustituye `YOUR_USER_UUID` por tu `auth.users.id` y ejecuta. Bórralo o ignóralo cuando uses datos reales.

## Rutas

| Ruta | Uso |
|------|-----|
| `/login` | Acceso privado |
| `/` | Dashboard (heatmaps + gráficas) |
| `/check-in` | Formulario diario Mobile First |

## Documentación de arquitectura

Ver [`PLAN.md`](./PLAN.md).
