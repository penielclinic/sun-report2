import * as React from "react";
import { cn } from "@/lib/utils";

export type CardTone = "white" | "brand" | "emerald" | "amber" | "violet" | "rose" | "sky" | "gold";

const TONE: Record<CardTone, string> = {
  white: "bg-white border-line",
  brand: "bg-gradient-to-br from-brand-600 to-brand-800 text-white border-transparent",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent",
  amber: "bg-gradient-to-br from-amber-400 to-orange-500 text-white border-transparent",
  violet: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white border-transparent",
  rose: "bg-gradient-to-br from-rose-500 to-pink-600 text-white border-transparent",
  sky: "bg-gradient-to-br from-sky-400 to-blue-500 text-white border-transparent",
  gold: "bg-gradient-to-br from-gold-400 to-amber-500 text-ink border-transparent",
};

export function Card({
  className,
  tone = "white",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: CardTone }) {
  return (
    <div
      className={cn("rounded-3xl border shadow-soft overflow-hidden", TONE[tone], className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-5 pb-3 sm:px-6", className)} {...props} />;
}

export function CardTitle({
  className,
  icon,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { icon?: React.ReactNode }) {
  return (
    <h3 className={cn("flex items-center gap-2 text-xl font-black tracking-tight", className)} {...props}>
      {icon}
      {children}
    </h3>
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-base text-ink-soft", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 sm:px-6", className)} {...props} />;
}
