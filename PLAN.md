# Reset Abenza — Plan de Arquitectura y Desarrollo

> Tracker personal para un año de reseteo físico y mental.  
> Documento de planificación end-to-end: stack, datos, roadmap y despliegue a coste cero.

---

## 1. Visión del producto

**Reset Abenza** es un dashboard privado para registrar y visualizar:

| Dominio | Qué se registra | Visualización |
|--------|------------------|---------------|
| Hábitos | Limpio (0 alcohol / 0 tabaco), Entrenamiento completado | Heatmap tipo GitHub (365 días) |
| Fuerza | Kilos movidos: sentadilla, peso muerto, prensa | Líneas de sobrecarga progresiva |
| EMOM | Repeticiones totales en EMOM 30' de dominadas y 30' de flexiones | Líneas de volumen (reps / sesión) |
| Cardio | Distancia (km) + duración + ritmo (min/km) | Volumen + ritmo combinados (ver §1.2) |
| Recuperación | FCR (bpm), sueño (1–10), energía (1–10) | Líneas de tendencia |

### 1.1 Protocolo EMOM (dominadas + flexiones)

En un mismo entrenamiento EMOM se hacen **dos bloques consecutivos**:

1. **Dominadas:** 1 serie cada minuto durante **30 minutos** (30 series).
2. **Flexiones:** 1 serie cada minuto durante **30 minutos** (30 series).

**Qué se guarda en el MVP:** repeticiones **totales** de cada bloque (suma de las 30 series). Es el KPI de progresión y cabe en el check-in rápido (2 campos numéricos).  
**Post-MVP (opcional):** array de reps por minuto (curva de fatiga dentro del EMOM).

### 1.2 Cardio: ritmo + distancia (por qué no basta solo el pace)

Correr **1 km a 4:45** no es comparable a correr **100 km a 5:00**. El ritmo mide *intensidad*; la distancia (y el tiempo) miden *volumen / carga*. Mezclarlos en un único número mágico suele engañar. La solución es **guardar las tres variables** y **mostrarlas juntas** en el dashboard.

**Datos por sesión (obligatorios si hay cardio):**

| Campo | Rol |
|-------|-----|
| `distance_km` | Volumen de la salida |
| `duration_min` | Tiempo total |
| `pace_min_per_km` | Intensidad media (`duration_min / distance_km`) |

En el formulario: introducir **2 de 3** y calcular el tercero automáticamente (p. ej. distancia + duración → ritmo; o distancia + ritmo → duración). Así el check-in sigue siendo rápido.

**Bloque visual “Cardio” en el dashboard (MVP):**

1. **KPIs del periodo** (mes o desde `RESET_START_DATE`):
   - Km totales
   - Salida más larga (km)
   - Mejor ritmo en salidas **≥ 5 km** (umbral configurable; evita que un sprint de 400 m “gane” al año)
2. **Gráfico combo (principal):** eje X = fecha  
   - **Barras** = `distance_km` (volumen)  
   - **Línea** = `pace_min_per_km` (eje Y derecho; invertido: más bajo = más rápido)  
   Así ves de un vistazo: “esta semana corrí mucho y a qué ritmo”.
3. **Tooltip rico** en cada punto: fecha, km, tiempo total, ritmo (mm:ss/km).

**Filtro útil (mismo chart):** “Solo salidas ≥ N km” aplicado a la **línea de ritmo** (las barras de volumen pueden seguir mostrando todas). Así el pace cuenta en contextos parecidos (rodajes reales, no micro-intervalos).

**Qué no hacer en el MVP:** un score único tipo “calidad = km × (1/pace)” como gráfica principal. Puede existir luego como KPI secundario (“carga relativa”), pero no sustituye ver volumen e intensidad por separado en el mismo lienzo.

```
Ejemplo de lectura del combo:
  Barras altas + línea estable  → buen volumen, ritmo consistente
  Barra baja + ritmo muy rápido → sesión corta/intensa (no “mejor” que un largo)
  Barras crecientes mes a mes   → progresión de resistencia (lo que pedías con los 100 km)
```

**UX crítica:** formulario diario Mobile First, completar en **&lt; 1 minuto**.  
**Seguridad:** autenticación cerrada — solo el propietario ve y escribe datos.

---

## 2. Stack tecnológico exacto (justificado)

### Decisión final

| Capa | Tecnología | Plan gratuito |
|------|------------|---------------|
| Framework | **Next.js 15 (App Router) + TypeScript** | — |
| UI | **Tailwind CSS + shadcn/ui** | — |
| Gráficas | **Recharts** | — |
| Heatmap | **Componente propio** (CSS Grid + datos agregados) | — |
| BaaS / DB / Auth | **Supabase** (PostgreSQL + Auth + RLS) | Free tier |
| Hosting + CI/CD | **Vercel** | Hobby |
| Control de versiones | **GitHub** | Free |
| Validación de formularios | **Zod + React Hook Form** | — |
| Fechas | **date-fns** | — |

### Por qué este stack (y no otros)

#### Frontend: Next.js + TypeScript (no Vue/Nuxt ni CRA)

- Un solo repo con rutas, layout de dashboard y API routes si hiciera falta.
- Despliegue nativo y trivial en Vercel (preview por PR incluido).
- App Router + Server Components: el dashboard puede cargar datos autenticados en servidor y reducir JS en cliente.
- Ecosistema React = Recharts + shadcn/ui sin fricción.
- TypeScript desde el día 1 evita errores en métricas y tipos de fecha.

**Alternativas descartadas (por ahora):**

| Opción | Motivo de descarte |
|--------|--------------------|
| Vue / Nuxt | Excelente, pero el ecosistema charts + UI + Vercel es más “baterías incluidas” en React para este caso. |
| Solo Vite + React SPA | Más trabajo de auth SSR, SEO irrelevante, y pierdes integración zero-config con Vercel/Supabase Auth helpers. |

#### UI: Tailwind + shadcn/ui

- Mobile First real con utilidades responsive.
- Componentes accesibles (Radix) copiados al repo: sin vendor lock-in de un design system pago.
- Ideal para un dashboard denso (formularios, cards de métricas, layout) sin reinventar inputs/dialogs.

#### Gráficas: Recharts

- API declarativa en React, suficiente para líneas y tooltips.
- Ligera para un proyecto personal; Chart.js añade más boilerplate en React.
- El heatmap **no** va con Recharts: un grid CSS con 7 filas × ~53 semanas es más fiel al estilo GitHub y más barato en render.

#### Backend: Supabase (no Firebase)

| Criterio | Supabase | Firebase |
|----------|----------|----------|
| Modelo de datos | PostgreSQL relacional | Firestore documental |
| Cruces hábitos ↔ métricas por fecha | SQL / vistas / joins naturales | Más denormalización o queries múltiples |
| Auth + RLS | Auth + Row Level Security por `auth.uid()` | Rules; OK, pero menos cómodo para agregaciones |
| Free tier | DB + Auth + Storage razonable para 1 usuario | También viable; peor fit analítico |

Para un dashboard analítico con “un día = una fila de hábitos + N métricas”, **Postgres gana**.

#### Hosting: Vercel (no Netlify)

- Primera clase para Next.js.
- CI/CD: push a `main` → producción; PR → preview URL.
- Variables de entorno para claves Supabase.
- Hobby free suficiente para tráfico personal.

---

## 3. Arquitectura de alto nivel

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│  Navegador  │ ──────────────► │  Vercel (Next.js)│
│  (móvil/PC) │ ◄────────────── │  App Router      │
└─────────────┘                 └────────┬─────────┘
                                         │
                         @supabase/ssr + anon key
                         (autorización real vía RLS)
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │  Supabase           │
                              │  • Auth (email)     │
                              │  • PostgreSQL       │
                              │  • RLS policies     │
                              └─────────────────────┘
```

**Principios:**

1. El cliente **nunca** confía en sí mismo: RLS en cada tabla (`user_id = auth.uid()`).
2. Un único usuario permitido: whitelist por email en Auth (o tabla `allowed_users` + trigger/policy).
3. Un registro “día” como ancla temporal para cruzar hábitos y métricas.
4. Formularios optimistas / upsert por `entry_date` para no duplicar el mismo día.

---

## 4. Esquema de base de datos

### 4.1 Modelo conceptual

```
profiles 1──1 auth.users
    │
    └─── daily_entries (1 fila por usuario + fecha)
              │
              ├── habit flags (limpio, entrenamiento)
              ├── recovery metrics (fcr, sueño, energía)
              ├── strength_logs (N ejercicios ese día)
              ├── emom_logs (0..2 bloques: dominadas + flexiones)
              └── cardio_logs (0..1 sesión de carrera ese día)
```

**Decisión de modelado:**  
Una tabla **`daily_entries`** concentra lo que es “1 valor por día” (hábitos + recuperación).  
Fuerza, EMOM y cardio van en tablas hijas porque un día puede tener varios ejercicios/bloques (y mañana podrías ampliar el protocolo).

Así el heatmap lee solo `daily_entries`, y las líneas de fuerza/EMOM hacen join por `entry_date` / `daily_entry_id` sin ensuciar el heatmap.

**EMOM:** una fila por bloque (`pull_up` o `push_up`) y día. En un entrenamiento típico: 2 filas (30' dominadas + 30' flexiones), cada una con `total_reps` y `duration_minutes = 30`.

### 4.2 Diagrama ER (simplificado)

```
auth.users
    │ id (uuid)
    ▼
profiles
    │ user_id (PK, FK)
    │ display_name
    │ created_at
    ▼
daily_entries
    │ id (uuid, PK)
    │ user_id (FK)
    │ entry_date (date)          -- UNIQUE(user_id, entry_date)
    │ habit_clean (boolean)      -- "Limpio"
    │ habit_training (boolean)   -- "Entrenamiento completado"
    │ resting_hr (smallint)      -- FCR bpm, nullable
    │ sleep_quality (smallint)   -- 1..10, nullable
    │ energy_level (smallint)    -- 1..10, nullable
    │ notes (text, nullable)
    │ created_at / updated_at
    │
    ├──► strength_logs
    │       id, daily_entry_id, user_id
    │       exercise (enum/text)
    │       weight_kg (numeric)
    │       sets / reps (opcionales, futuro)
    │
    ├──► emom_logs
    │       id, daily_entry_id, user_id
    │       exercise (pull_up | push_up)  -- dominadas | flexiones
    │       duration_minutes (default 30)
    │       total_reps (int)              -- suma de las series del bloque
    │       reps_per_round (int[], opcional post-MVP)
    │
    └──► cardio_logs
            id, daily_entry_id, user_id
            activity_type (default 'run')
            distance_km (numeric, required)      -- volumen
            duration_min (numeric, required)     -- tiempo total
            pace_min_per_km (numeric, required)  -- duration/distance; ej. 5.45 ≈ 5:27/km
```

### 4.3 SQL propuesto (Supabase / Postgres)

```sql
-- Extensiones
create extension if not exists "pgcrypto";

-- Perfil espejo del usuario Auth
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Entrada diaria (ancla para heatmap + recuperación + joins)
create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  habit_clean boolean not null default false,
  habit_training boolean not null default false,
  resting_hr smallint check (resting_hr is null or (resting_hr between 30 and 120)),
  sleep_quality smallint check (sleep_quality is null or (sleep_quality between 1 and 10)),
  energy_level smallint check (energy_level is null or (energy_level between 1 and 10)),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index daily_entries_user_date_idx
  on public.daily_entries (user_id, entry_date desc);

-- Ejercicios de fuerza clave
create type public.strength_exercise as enum (
  'squat',        -- sentadilla
  'deadlift',     -- peso muerto
  'leg_press'     -- prensa
);

create table public.strength_logs (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise public.strength_exercise not null,
  weight_kg numeric(6,2) not null check (weight_kg > 0 and weight_kg < 1000),
  created_at timestamptz not null default now(),
  unique (daily_entry_id, exercise)
);

create index strength_logs_user_exercise_idx
  on public.strength_logs (user_id, exercise, created_at);

-- EMOM: 1 serie/minuto × N minutos (por defecto 30) por ejercicio
create type public.emom_exercise as enum (
  'pull_up',  -- dominadas
  'push_up'   -- flexiones
);

create table public.emom_logs (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise public.emom_exercise not null,
  duration_minutes smallint not null default 30
    check (duration_minutes between 1 and 120),
  total_reps integer not null check (total_reps >= 0 and total_reps < 5000),
  -- Post-MVP: detalle minuto a minuto (length ≈ duration_minutes)
  reps_per_round integer[],
  created_at timestamptz not null default now(),
  unique (daily_entry_id, exercise),
  -- Nota: la coherencia total_reps = sum(reps_per_round) se valida en app/trigger
  -- (CHECK de Postgres no admite subconsultas sobre unnest).
  check (
    reps_per_round is null
    or cardinality(reps_per_round) = duration_minutes
  )
);

create index emom_logs_user_exercise_idx
  on public.emom_logs (user_id, exercise, created_at);

-- Cardio: volumen + tiempo + ritmo (las 3; 2 se introducen y 1 se deriva en app)
create table public.cardio_logs (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_type text not null default 'run',
  distance_km numeric(6,2) not null check (distance_km > 0 and distance_km < 500),
  duration_min numeric(7,2) not null check (duration_min > 0 and duration_min < 10000),
  pace_min_per_km numeric(5,2) not null check (pace_min_per_km > 0 and pace_min_per_km < 30),
  created_at timestamptz not null default now(),
  unique (daily_entry_id, activity_type),
  -- Coherencia aproximada: pace ≈ duration / distance (tolerancia 2%)
  check (
    abs(pace_min_per_km - (duration_min / distance_km))
      <= greatest(0.05, (duration_min / distance_km) * 0.02)
  )
);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger daily_entries_updated_at
  before update on public.daily_entries
  for each row execute function public.set_updated_at();
```

### 4.4 Seguridad (RLS + usuario único)

```sql
alter table public.profiles enable row level security;
alter table public.daily_entries enable row level security;
alter table public.strength_logs enable row level security;
alter table public.emom_logs enable row level security;
alter table public.cardio_logs enable row level security;

-- Solo el dueño de la fila
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_entries_own" on public.daily_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "strength_logs_own" on public.strength_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "emom_logs_own" on public.emom_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cardio_logs_own" on public.cardio_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**Cierre a un solo usuario (recomendado en Auth UI + política):**

1. En Supabase Auth: desactivar sign-ups públicos (`Enable email signup` off tras crear tu cuenta), o  
2. Tabla de allowlist:

```sql
create table public.allowed_emails (
  email citext primary key
);

-- Insertar tu email una vez (desde SQL editor con service role)
-- insert into public.allowed_emails values ('tu@email.com');
```

Y un hook / Edge Function / validación en el cliente + política adicional que compruebe el email de `auth.jwt()`. Para un proyecto personal, **lo más simple y robusto** es:

1. Crear solo tu usuario.
2. Desactivar nuevos registros en el dashboard de Supabase.
3. RLS por `auth.uid()` en todas las tablas.

### 4.5 Vistas / consultas para el dashboard

```sql
-- Serie de fuerza por ejercicio (para Recharts)
-- select e.entry_date, s.exercise, s.weight_kg
-- from strength_logs s
-- join daily_entries e on e.id = s.daily_entry_id
-- where s.user_id = auth.uid() and s.exercise = 'squat'
-- order by e.entry_date;

-- Serie EMOM: volumen total y ritmo medio (reps/min)
-- select e.entry_date, m.exercise, m.total_reps,
--        round(m.total_reps::numeric / m.duration_minutes, 2) as reps_per_min
-- from emom_logs m
-- join daily_entries e on e.id = m.daily_entry_id
-- where m.user_id = auth.uid()
-- order by e.entry_date, m.exercise;

-- Cardio para gráfico combo (barras km + línea pace)
-- select e.entry_date, c.distance_km, c.duration_min, c.pace_min_per_km
-- from cardio_logs c
-- join daily_entries e on e.id = c.daily_entry_id
-- where c.user_id = auth.uid()
-- order by e.entry_date;

-- Mejor ritmo solo en salidas “comparables” (≥ 5 km)
-- select min(c.pace_min_per_km) as best_pace
-- from cardio_logs c
-- where c.user_id = auth.uid() and c.distance_km >= 5;

-- Heatmap: rango de fechas del año
-- select entry_date, habit_clean, habit_training
-- from daily_entries
-- where user_id = auth.uid()
--   and entry_date between :year_start and :year_end;
```

### 4.6 Contrato del formulario diario (upsert)

Payload conceptual del “check-in” &lt; 1 min:

```ts
type DailyCheckIn = {
  entry_date: string; // YYYY-MM-DD
  habit_clean: boolean;
  habit_training: boolean;
  resting_hr?: number;
  sleep_quality?: number;
  energy_level?: number;
  strength?: Partial<Record<'squat' | 'deadlift' | 'leg_press', number>>;
  // EMOM: totales del bloque 30' (opcionales; un día puede no tener EMOM)
  emom?: {
    pull_up_total_reps?: number;  // dominadas, 30 series
    push_up_total_reps?: number;  // flexiones, 30 series
    duration_minutes?: number;    // default 30; mismo valor para ambos bloques
  };
  // Cardio: al menos 2 de 3; el tercero se deriva en cliente antes del upsert
  cardio?: {
    distance_km?: number;
    duration_min?: number;
    pace_min_per_km?: number; // o string "mm:ss" en UI, convertido a decimal
  };
  notes?: string;
};
```

Flujo:

1. `upsert` en `daily_entries` por `(user_id, entry_date)`.
2. Si hay pesos → `upsert` en `strength_logs` por `(daily_entry_id, exercise)`.
3. Si hay totales EMOM → `upsert` en `emom_logs` por `(daily_entry_id, exercise)`  
   (`pull_up` y /o `push_up`, `duration_minutes` por defecto 30).
4. Si hay cardio → completar el trío distancia/duración/ritmo → `upsert` en `cardio_logs`.

Campos opcionales permiten días “solo hábitos” o “solo fuerza” sin romper gráficas (nulls omitidos en series).

**UX check-in EMOM:** sección colapsable “EMOM” con 2 inputs — *Dominadas (reps totales 30')* y *Flexiones (reps totales 30')*. No pedir las 30 series en el MVP (rompería el &lt; 1 min).

**UX check-in Cardio:** inputs *Distancia (km)* + *Tiempo* → ritmo calculado en vivo. Alternativa: distancia + ritmo → tiempo. Por defecto: **distancia + tiempo** (lo habitual en el reloj).

---

## 5. Estructura de la aplicación (Next.js)

```
reset-abenza/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/                 # layout protegido
│   │   ├── layout.tsx         # guard de sesión
│   │   ├── page.tsx           # Dashboard
│   │   └── check-in/page.tsx  # Formulario móvil
│   ├── auth/callback/route.ts # OAuth, si se usa
│   └── layout.tsx
├── components/
│   ├── charts/
│   │   ├── strength-chart.tsx
│   │   ├── emom-chart.tsx
│   │   ├── cardio-chart.tsx
│   │   └── recovery-charts.tsx
│   ├── heatmap/
│   │   └── habit-heatmap.tsx
│   └── check-in/
│       └── daily-form.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── validations/check-in.ts
├── supabase/
│   └── migrations/0001_init.sql
└── PLAN.md
```

### Pantallas mínimas (MVP)

1. **Login** — email + password (o magic link).
2. **Dashboard** — heatmaps (2) + bloques de charts (fuerza, EMOM, cardio, recuperación).
3. **Check-in** — formulario sticky / bottom CTA en móvil; toggles grandes; inputs numéricos con teclado adecuado (`inputMode`); bloque EMOM con totales de dominadas/flexiones.

### Heatmap (detalle UX)

- Dos grids independientes o un grid con dos capas/colores (preferible **dos heatmaps** apilados: más legible).
- Escala: vacío / false / true (3 estados), no 5 niveles de intensidad.
- Tooltip: fecha + estado.
- Rango: año civil del “reset” o últimos 365 días (configurable con constante `RESET_START_DATE`).

---

## 6. Roadmap de desarrollo

### Fase 0 — Fundaciones (½ día)

- [x] Crear repo GitHub `ResetAbenza`. *(https://github.com/albertuco3/reset-abenza)*
- [x] `npx create-next-app@latest` (TS, Tailwind, App Router, ESLint).
- [ ] Inicializar shadcn/ui.
- [x] Crear proyecto Supabase; copiar URL + anon key.
- [x] Instalar `@supabase/supabase-js` y `@supabase/ssr`.
- [x] Aplicar migración SQL (tablas + RLS). *(archivo listo en `supabase/migrations/0001_init.sql`)*
- [x] Crear usuario; **desactivar sign-ups**. *(usuario creado; ver nota UI abajo si falta cerrar registro)*
- [x] Definir `RESET_START_DATE` (inicio del año de reseteo).

**Criterio de salida:** Next arranca en local; Supabase responde a una query de prueba autenticada.

### Fase 1 — Auth cerrada (½–1 día)

- [x] Página `/login`.
- [x] Middleware Next que redirige a `/login` si no hay sesión.
- [x] Callback / refresh de sesión (`@supabase/ssr`).
- [x] Logout en layout.
- [ ] Probar que rutas del dashboard no son accesibles sin cookie de sesión.

**Criterio de salida:** solo tu cuenta entra; anónimo ve solo login.

### Fase 2 — Check-in Mobile First (1–2 días)

- [ ] Página `/check-in` con React Hook Form + Zod.
- [ ] Toggles grandes: Limpio / Entrenamiento.
- [ ] Bloque recuperación: FCR, sueño, energía (sliders o steppers 1–10).
- [ ] Bloque fuerza: 3 inputs kg (opcionales).
- [ ] Bloque EMOM: reps totales dominadas (30') + reps totales flexiones (30'), opcionales.
- [ ] Bloque cardio: distancia + tiempo (ritmo auto) o distancia + ritmo; helper mm:ss.
- [ ] Upsert atómico (entry + strength + emom + cardio) vía cliente Supabase o Server Action.
- [ ] Feedback toast “Guardado” + opción “ir al dashboard”.
- [ ] Default `entry_date = hoy` (timezone Europe/Madrid).

**Criterio de salida:** en el móvil, un día completo se registra en &lt; 60 s.

### Fase 3 — Dashboard analítico (2–3 días)

- [ ] Heatmap Limpio + Heatmap Entrenamiento (datos del año).
- [ ] Chart fuerza: 3 series o tabs por ejercicio (sentadilla / muerto / prensa).
- [ ] Chart EMOM: 2 series (dominadas / flexiones) de `total_reps` en el tiempo; tooltip con reps/min.
- [ ] Cardio KPIs: km totales, salida más larga, mejor ritmo en salidas ≥ 5 km.
- [ ] Chart cardio combo: barras `distance_km` + línea `pace_min_per_km` (eje derecho, invertido); tooltip con km/tiempo/ritmo.
- [ ] Filtro opcional “ritmo solo si distancia ≥ N km”.
- [ ] Charts recuperación: FCR, sueño, energía (pueden ser 3 small multiples).
- [ ] Empty states cuando no hay datos.
- [ ] Skeleton loaders; layout responsive (charts apilados en móvil).

**Criterio de salida:** con 2–3 semanas de datos seed, se ven tendencias claras.

### Fase 4 — Pulido y datos semilla (1 día)

- [ ] Seed SQL o script para datos de prueba (borrar antes de prod real).
- [ ] Validaciones de rangos y mensajes de error claros.
- [ ] PWA light opcional (`manifest` + icon) para “Añadir a inicio” en el móvil.
- [ ] README con variables de entorno.

**Criterio de salida:** usable a diario sin fricción.

### Fase 5 — Despliegue producción (½ día)

- [ ] Conectar repo a Vercel.
- [ ] Env vars de producción.
- [ ] Dominio `*.vercel.app` (custom domain opcional).
- [ ] Smoke test: login → check-in → ver punto en heatmap/charts.
- [ ] Revisar que sign-up sigue desactivado en Supabase prod.

**Criterio de salida:** URL pública, acceso solo con tu login, coste $0.

### Fase 6 — Post-MVP (backlog, no bloqueante)

- EMOM detalle: captura de `reps_per_round` (30 inputs o stepper rápido minuto a minuto) + gráfica de fatiga intra-sesión.
- Export CSV / JSON del año.
- Racha actual (“streak”) de días limpios / entrenamiento / EMOM.
- Objetivos anuales y % de cumplimiento (ej. volumen EMOM del mes).
- Recordatorio (opcional: email Cron de Vercel + Resend free — valorar límites).
- Comparativa mes vs mes.

---

## 7. Guía de despliegue (coste cero)

### 7.1 Supabase (producción)

1. Ve a [https://supabase.com](https://supabase.com) → **New project** (región cercana, ej. `eu-west-1` / Frankfurt).
2. Guarda la **Database password** en un gestor seguro.
3. **SQL Editor** → pega y ejecuta la migración de la sección 4.3 + políticas RLS 4.4.
4. **Authentication → Users** → *Add user* con tu email y password.
5. **Cerrar registros públicos** (elige una ruta según la UI de tu proyecto):
   - **Authentication → Providers → Email** → desactiva **Allow new users to sign up** / *Enable sign ups*, **o**
   - **Authentication → Settings** (o *Project Settings → Authentication*) → sección **User Signups** → desactiva **Allow new users to sign up**.
   - Importante: no desactives el proveedor Email entero (seguirías sin poder hacer login).
   - Nuestra app solo tiene `/login` (sin formulario de registro); este toggle cierra también `signUp()` por API.
6. **Project Settings → API**:
   - `Project URL`
   - `anon` `public` key  
   (La `service_role` **no** va al frontend ni a Vercel salvo Server Action muy controlada; para este MVP no hace falta.)

### 7.2 Variables de entorno

Local (`.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_RESET_START_DATE=2026-01-01
```

Las mismas keys en Vercel → **Settings → Environment Variables** (Production + Preview).

### 7.3 Vercel + GitHub (CI/CD)

1. Sube el código a GitHub (repo privado recomendado).
2. [https://vercel.com](https://vercel.com) → **Add New Project** → Import del repo.
3. Framework Preset: **Next.js** (auto).
4. Añade las env vars de arriba.
5. Deploy.
6. Cada push a `main` redeploy automático; cada PR genera preview.

### 7.4 Auth en producción (checklist)

| Check | Acción |
|-------|--------|
| Site URL | En Supabase → Authentication → URL Configuration: `https://tu-app.vercel.app` |
| Redirect URLs | `https://tu-app.vercel.app/**` y `http://localhost:3000/**` |
| Signups | Desactivados |
| RLS | Enabled en las 5 tablas (`profiles`, `daily_entries`, `strength_logs`, `emom_logs`, `cardio_logs`) |
| Smoke test | Incógnito sin login → solo `/login` |

### 7.5 Límites free tier (expectativa realista)

| Servicio | Uso esperado (1 usuario) | ¿Cabe en free? |
|----------|--------------------------|----------------|
| Supabase DB | &lt; unos miles de filas/año (hábitos + fuerza + EMOM + cardio) | Sí, holgado |
| Supabase Auth | 1 usuario activo | Sí |
| Vercel Hobby | Tráfico personal | Sí |
| Ancho de banda charts | Bajo | Sí |

No necesitas Cloud Functions ni Storage para el MVP.

### 7.6 Comandos locales de referencia

```powershell
# Crear app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"

# Dependencias core
npm install @supabase/supabase-js @supabase/ssr recharts date-fns zod react-hook-form @hookform/resolvers

# shadcn (tras init)
npx shadcn@latest init
npx shadcn@latest add button card input label switch slider toast form

# Desarrollo
npm run dev
```

---

## 8. Criterios de aceptación globales

1. Login obligatorio; sin sesión no hay lectura ni escritura de datos.
2. Check-in diario usable con una mano en móvil en &lt; 1 minuto (EMOM = 2 totales, no 60 series).
3. Heatmaps reflejan `habit_clean` y `habit_training` por día del año de reseteo.
4. Charts de fuerza, EMOM, cardio (volumen + ritmo) y recuperación muestran series temporales correctas tras upserts.
5. Una sesión de cardio guarda distancia, duración y ritmo coherentes; el dashboard no prioriza un sprint corto frente a un largo.
6. Un día con EMOM puede guardar ambos bloques (`pull_up` + `push_up`) o solo uno.
7. Despliegue en Vercel + Supabase en free tiers, con CI desde GitHub.
8. Un solo propietario operativo (sign-up cerrado + RLS).

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Timezone “día” incorrecto (UTC vs Madrid) | Guardar `entry_date` como `date` elegida en UI; default con `Europe/Madrid`. |
| Duplicar el mismo día | `UNIQUE (user_id, entry_date)` + upsert. |
| Pausas del free tier (Supabase inactivo) | Proyecto personal con uso diario evita pausa; si pausa, un wake-up al abrir la app. |
| Scope creep (social, IA, wearables) | Congelar MVP en las 3 pantallas; backlog en Fase 6. |

---

## 10. Orden de ejecución recomendado (resumen ejecutivo)

1. **Supabase** proyecto + SQL + usuario único.  
2. **Next.js** + auth middleware.  
3. **Check-in** (valor diario inmediato).  
4. **Dashboard** (heatmaps → fuerza / EMOM / cardio / recuperación).  
5. **Vercel** + env + smoke test.  

Con este orden tienes utilidad personal desde el día 2–3, y el “wow” visual del dashboard cierra el ciclo de motivación del año de reseteo.

---

*Documento vivo: actualizar este PLAN.md si cambian fechas de inicio del reset, ejercicios clave, protocolo EMOM o el proveedor BaaS.*
