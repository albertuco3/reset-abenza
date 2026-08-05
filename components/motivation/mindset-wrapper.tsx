"use client";

import { useEffect, useState } from "react";
import { MindsetModal } from "./mindset-modal";

interface MindsetWrapperProps {
  /** Si es true, intentará abrirse automáticamente la primera vez que se cargue en el día */
  autoCheckToday?: boolean;
  /** Estilos opcionales o variant para el botón */
  className?: string;
  /** Texto opcional para el botón */
  label?: string;
}

export function MindsetWrapper({
  autoCheckToday = false,
  className = "",
  label = "Mindset 🔥",
}: MindsetWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!autoCheckToday) return;

    const todayISO = new Date().toISOString().split("T")[0];
    const dismissedDate = localStorage.getItem("reset_mindset_dismissed_date");

    if (dismissedDate !== todayISO) {
      setIsOpen(true);
    }
  }, [autoCheckToday]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 hover:text-amber-900 transition dark:text-amber-400 dark:hover:text-amber-300"
        }
        title="Ver manifiesto y recordatorio del reseteo"
      >
        <span>🔥</span>
        <span>{label}</span>
      </button>

      <MindsetModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
