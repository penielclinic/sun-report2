"use client";

import { useEffect, useState } from "react";
import { ALargeSmall } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "sunbogo:font";

/** 글자 크기 보통/크게 전환 (localStorage 저장) */
export function FontSizeToggle({ className, light }: { className?: string; light?: boolean }) {
  const [large, setLarge] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setLarge(localStorage.getItem(KEY) === "large");
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function toggle() {
    const next = !large;
    setLarge(next);
    try {
      if (next) localStorage.setItem(KEY, "large");
      else localStorage.removeItem(KEY);
    } catch {}
    document.documentElement.toggleAttribute("data-font", next);
    if (next) document.documentElement.setAttribute("data-font", "large");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={large}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 h-11 text-[0.95rem] font-bold transition-colors border",
        light
          ? "bg-white/15 text-white border-white/30 hover:bg-white/25"
          : "bg-white text-ink-soft border-line shadow-soft hover:text-brand-700",
        className
      )}
      title="글자 크기 바꾸기"
    >
      <ALargeSmall className="h-5 w-5" />
      {large ? "글자 보통" : "글자 크게"}
    </button>
  );
}
