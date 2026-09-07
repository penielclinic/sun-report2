import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-[1.05rem] font-bold text-ink mb-1.5", className)} {...props} />;
}

export function Hint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1.5 text-[0.95rem] text-ink-soft leading-snug", className)} {...props} />;
}

const baseInput =
  "w-full rounded-2xl border-2 border-line bg-white px-4 text-ink placeholder:text-slate-400 transition-colors " +
  "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-500";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(baseInput, "h-14 text-lg", className)} {...props} />;
  }
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(baseInput, "py-3 text-lg leading-relaxed resize-none", className)} {...props} />;
  }
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(baseInput, "app-select h-14 text-lg appearance-none", className)} {...props}>
        {children}
      </select>
    );
  }
);

export function Field({
  label,
  hint,
  htmlFor,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-rose-500" aria-hidden>*</span>}
      </Label>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}
