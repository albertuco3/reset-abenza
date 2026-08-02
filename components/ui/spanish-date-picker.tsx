"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { format, parseISO } from "date-fns";
import { es as esDateFns } from "date-fns/locale";
import "react-day-picker/style.css";

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (isoDate: string) => void;
  className?: string;
};

export function SpanishDatePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = value ? parseISO(value) : undefined;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const label = selected
    ? format(selected, "d 'de' MMMM yyyy", { locale: esDateFns })
    : "Elegir fecha";

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-300 bg-white px-3 text-left text-base text-zinc-900 outline-none focus:border-emerald-700"
      >
        <span className="capitalize">{label}</span>
        <span className="text-xs text-zinc-500">▼</span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-zinc-200">
          <DayPicker
            mode="single"
            locale={es}
            weekStartsOn={1}
            selected={selected}
            onSelect={(day) => {
              if (!day) return;
              onChange(format(day, "yyyy-MM-dd"));
              setOpen(false);
            }}
            defaultMonth={selected}
            classNames={{
              root: "rdp-root",
              today: "font-semibold text-emerald-800",
              selected: "bg-emerald-800 text-white rounded-lg",
              chevron: "fill-emerald-800",
            }}
            footer={
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-100 pt-2">
                <button
                  type="button"
                  className="ml-auto text-xs font-medium text-emerald-800 hover:underline"
                  onClick={() => {
                    onChange(format(new Date(), "yyyy-MM-dd"));
                    setOpen(false);
                  }}
                >
                  Hoy
                </button>
              </div>
            }
          />
        </div>
      ) : null}
    </div>
  );
}
