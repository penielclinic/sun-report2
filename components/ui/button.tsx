import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "gold";
export type ButtonSize = "sm" | "md" | "lg" | "xl" | "icon";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-[0_8px_20px_-8px_rgb(36_71_234/0.6)] hover:from-brand-700 hover:to-brand-600 active:translate-y-px",
  secondary: "bg-brand-50 text-brand-800 hover:bg-brand-100 border border-brand-100",
  outline: "bg-white text-ink border-2 border-line hover:border-brand-300 hover:bg-brand-50/50",
  ghost: "bg-transparent text-ink-soft hover:bg-black/5",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-[0_8px_20px_-8px_rgb(225_29_72/0.5)]",
  success:
    "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 shadow-[0_8px_20px_-8px_rgb(5_150_105/0.6)]",
  gold: "bg-gradient-to-r from-gold-500 to-amber-400 text-ink hover:from-gold-600 hover:to-amber-500 shadow-[0_8px_20px_-8px_rgb(217_173_46/0.6)]",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-[0.95rem] rounded-xl gap-1.5",
  md: "h-13 px-5 text-base rounded-2xl gap-2",
  lg: "h-15 px-6 text-lg rounded-2xl gap-2.5",
  xl: "h-17 px-7 text-xl rounded-3xl gap-3",
  icon: "h-12 w-12 rounded-2xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: string;
  full?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  href,
  full,
  children,
  disabled,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center font-bold select-none whitespace-nowrap transition-all duration-150",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANT[variant],
    SIZE[size],
    full && "w-full",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type ?? "button"} className={classes} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
