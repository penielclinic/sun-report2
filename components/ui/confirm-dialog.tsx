"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface Options {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type Resolver = (ok: boolean) => void;

const ConfirmContext = React.createContext<((o: Options) => Promise<boolean>) | null>(null);

/** 앱 전체에서 `const ok = await confirm({...})` 로 쓰는 큰 확인 대화상자 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{ opts: Options; resolve: Resolver } | null>(null);
  const ref = React.useRef<HTMLDialogElement>(null);

  const confirm = React.useCallback((opts: Options) => {
    return new Promise<boolean>((resolve) => setState({ opts, resolve }));
  }, []);

  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (state && !d.open) d.showModal();
    if (!state && d.open) d.close();
  }, [state]);

  function finish(ok: boolean) {
    state?.resolve(ok);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={ref}
        onCancel={(e) => {
          e.preventDefault();
          finish(false);
        }}
        className="m-auto w-[min(92vw,26rem)] rounded-3xl p-0 shadow-pop backdrop:bg-ink/50 backdrop:backdrop-blur-sm open:pop-in"
      >
        {state && (
          <div className="p-6 text-center">
            <div
              className={
                "mx-auto mb-3 grid h-16 w-16 place-items-center rounded-3xl " +
                (state.opts.danger ? "bg-rose-100 text-rose-600" : "bg-brand-100 text-brand-600")
              }
            >
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black">{state.opts.title}</h2>
            {state.opts.description && (
              <p className="mt-2 text-base text-ink-soft whitespace-pre-line">{state.opts.description}</p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" size="lg" onClick={() => finish(false)}>
                {state.opts.cancelLabel ?? "취소"}
              </Button>
              <Button variant={state.opts.danger ? "danger" : "primary"} size="lg" onClick={() => finish(true)} autoFocus>
                {state.opts.confirmLabel ?? "확인"}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
