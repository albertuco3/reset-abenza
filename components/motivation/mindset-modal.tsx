"use client";

import { useEffect, useState } from "react";

type TabType = "inventory" | "espartano";

interface MindsetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MindsetModal({ isOpen, onClose }: MindsetModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("inventory");
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    if (dontShowToday) {
      const todayISO = new Date().toISOString().split("T")[0];
      localStorage.setItem("reset_mindset_dismissed_date", todayISO);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop con desfoque */}
      <div
        className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Contenedor del Modal: Estilo Bottom Sheet en móvil, Modal centrado en escritorio */}
      <div className="relative z-10 flex max-h-[78dvh] sm:max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border-t sm:border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl ring-1 ring-white/10">
        
        {/* Indicador táctil visual para móvil */}
        <div className="flex sm:hidden justify-center pt-2 pb-0.5 bg-zinc-900 shrink-0">
          <div className="h-1 w-10 rounded-full bg-zinc-700/60" />
        </div>

        {/* Cabecera (shrink-0) */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 text-amber-400 ring-1 ring-amber-500/30 text-base sm:text-lg">
              🔥
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Mindset del Reseteo
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                1 Año de transformación fisiológica y mental
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-800/50 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Navegación por Pestañas (shrink-0) */}
        <div className="flex shrink-0 overflow-x-auto border-b border-zinc-800 bg-zinc-950/50 px-3 sm:px-5 pt-2 sm:pt-3 gap-1.5 sm:gap-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-t-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition border-b-2 ${
              activeTab === "inventory"
                ? "border-emerald-500 bg-zinc-900 text-emerald-400 shadow-sm"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
          >
            <span>🧠</span>
            <span>Inventario Fisiológico</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("espartano")}
            className={`flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-t-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition border-b-2 ${
              activeTab === "espartano"
                ? "border-rose-500 bg-zinc-900 text-rose-400 shadow-sm"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
          >
            <span>🔥</span>
            <span>Modo Espartano</span>
          </button>
        </div>

        {/* Cuerpo / Contenido desplazable (min-h-0 + flex-1) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
          {activeTab === "inventory" ? (
            <div className="space-y-4 sm:space-y-5">
              {/* Nota introductoria */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3.5 sm:p-4 text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                💡 <strong className="text-emerald-400">Pura Fisiología:</strong> Este es el inventario exacto de todo lo que vas a ganar en este año de reseteo biológico. No es motivación barata, es ciencia aplicada a tu cuerpo.
              </div>

              {/* Grid de 4 Pilares */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                
                {/* 1. Cerebro */}
                <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-zinc-900 p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs sm:text-sm">
                    <span className="text-base sm:text-lg">🧠</span>
                    <span>Tu Cerebro y Agilidad Mental</span>
                  </div>
                  <ul className="space-y-2 text-[11px] sm:text-xs text-zinc-300">
                    <li>
                      <strong className="text-cyan-300">Foco absoluto frente a la pantalla:</strong> Vas a entrar en &quot;la zona&quot; al picar código o resolver problemas de arquitectura web mucho más rápido. Sin neuroinflamación, procesarás y retendrás conceptos complejos a otro nivel.
                    </li>
                    <li>
                      <strong className="text-cyan-300">Adiós a la niebla mental:</strong> Desaparece la sensación de estar &quot;espeso&quot;. Tu memoria a corto plazo será nítida como un cristal.
                    </li>
                    <li>
                      <strong className="text-cyan-300">Dopamina reseteada:</strong> Disfrutarás de las cosas pequeñas. Tu energía nacerá de forma natural, sin necesitar el chute artificial de nicotina o alcohol.
                    </li>
                    <li>
                      <strong className="text-cyan-300">Estabilidad emocional:</strong> Sin resacas ni bajones de serotonina, mantendrás la cabeza fría, menos irritabilidad y resiliencia de acero.
                    </li>
                  </ul>
                </div>

                {/* 2. Salud */}
                <div className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-zinc-900 p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs sm:text-sm">
                    <span className="text-base sm:text-lg">🫀</span>
                    <span>Tu Salud y Vitalidad (Por dentro)</span>
                  </div>
                  <ul className="space-y-2 text-[11px] sm:text-xs text-zinc-300">
                    <li>
                      <strong className="text-rose-300">Oxígeno a raudales:</strong> Pulmones limpios de monóxido de carbono. Sangre oxigenada para no cansarte al subir escaleras o hacer esfuerzos.
                    </li>
                    <li>
                      <strong className="text-rose-300">Sueño reparador de verdad:</strong> Ciclos completos de sueño profundo (REM). Te despertarás con las pilas a tope sin arrastrarte fuera de la cama.
                    </li>
                    <li>
                      <strong className="text-rose-300">Frecuencia cardíaca en el suelo:</strong> Tu corazón latirá más relajado, liberado del estado de alerta constante por procesar toxinas.
                    </li>
                    <li>
                      <strong className="text-rose-300">Sistema inmune blindado:</strong> Menos enfermedades, digestiones ligeras y absorbentes.
                    </li>
                  </ul>
                </div>

                {/* 3. Físico y Rendimiento */}
                <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-zinc-900 p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm">
                    <span className="text-base sm:text-lg">🦍</span>
                    <span>Tu Físico y Rendimiento</span>
                  </div>
                  <ul className="space-y-2 text-[11px] sm:text-xs text-zinc-300">
                    <li>
                      <strong className="text-amber-300">Creación de músculo real:</strong> Sin alcohol bloqueando la síntesis proteica, cada sentadilla, remo pesado y fondo en anillas será hipertrofia real.
                    </li>
                    <li>
                      <strong className="text-amber-300">Quema de grasa sin frenos:</strong> Hígado libre de eliminar toxinas = cardio destinado directamente a oxidar grasa. Recomposición corporal pura.
                    </li>
                    <li>
                      <strong className="text-amber-300">Recuperación del SNC:</strong> Moverás más kilos tirando pesado porque tu sistema nervioso central estará fresco y recuperado.
                    </li>
                    <li>
                      <strong className="text-amber-300">Fondo físico brutal:</strong> Tus ritmos (min/km) en asfalto bajarán en picado. Correr pasará de ser agonía a un disfrute absoluto.
                    </li>
                  </ul>
                </div>

                {/* 4. Estética */}
                <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-zinc-900 p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm">
                    <span className="text-base sm:text-lg">📸</span>
                    <span>Estética y &quot;El Efecto Buena Cara&quot;</span>
                  </div>
                  <ul className="space-y-2 text-[11px] sm:text-xs text-zinc-300">
                    <li>
                      <strong className="text-emerald-300">Piel nueva (Colágeno a tope):</strong> Sin tabaco destruyendo elastina ni alcohol deshidratándote. Tono sano, rosado y brillante.
                    </li>
                    <li>
                      <strong className="text-emerald-300">Rostro definido:</strong> Cero inflamación ni retención de líquidos. Facciones afinadas, cara deshinchada y ojeras borradas mes a mes.
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {/* Alerta Espartana */}
              <div className="rounded-xl border border-rose-600/40 bg-gradient-to-r from-rose-950/60 via-red-950/40 to-zinc-900 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-lg shadow-rose-950/30">
                <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs sm:text-base uppercase tracking-wider">
                  <span>⚡</span>
                  <span>Recordatorio Anti-Excusas</span>
                </div>
                
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
                  Si hoy te rajas y cedes, estás escupiendo en la cara de la bestia en la que te estás convirtiendo. Fallar hoy es volver a la casilla de salida, es ser ese tío conformista que se rinde por un triste chute de dopamina barata.
                </p>

                <div className="rounded-lg border border-rose-500/30 bg-zinc-950/80 p-3 sm:p-3.5 text-xs sm:text-sm font-bold text-rose-300 text-center tracking-wide">
                  ¿Te entra el mono de un cigarro o una copa? ¡Te jodes y aguantas!
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Las ganas de rendirte duran cinco putos minutos, pero la hostia de realidad de mirarte al espejo, ver a un espartano que ha reventado el muro con la puta cabeza y saber que no te has doblegado, <strong className="text-amber-400">eso te dura toda la vida.</strong>
                </p>
              </div>

              {/* Bloque Rock Lee */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                  <span>🍃</span>
                  <span>Acuérdate de Rock Lee</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic">
                  Acuérdate de Rock Lee quitándose las pesas de las piernas. No hay magia, no hay suerte, no hay atajos. Solo disciplina pura, testosterona y una fuerza de voluntad inquebrantable forjada a base de dejarte los huevos cada día, por encima del dolor y de las excusas.
                </p>
              </div>

              {/* Remate final */}
              <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-zinc-900 p-4 sm:p-5 text-center space-y-2">
                <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                  Así que aprieta los dientes. Bébete un puto vaso de agua helada, pégate un grito si hace falta, levanta la cabeza y vuelve a agarrar las anillas.
                </p>
                <p className="text-xs sm:text-base font-black tracking-wider text-emerald-400 uppercase pt-1">
                  Tienes 365 días para aniquilar a tu yo del pasado. ¡A REVENTARLO, JODER! 🔥
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal (shrink-0) */}
        <div className="flex shrink-0 flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 border-t border-zinc-800 bg-zinc-950/90 px-4 py-3 sm:px-5 sm:py-3.5">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none hover:text-zinc-200">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/40"
            />
            <span>No mostrar automáticamente hoy</span>
          </label>

          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 sm:py-2 text-xs font-bold text-white shadow-md shadow-amber-900/30 transition hover:from-amber-500 hover:to-orange-500 text-center"
          >
            Entendido, a darle duro 💪
          </button>
        </div>

      </div>
    </div>
  );
}
