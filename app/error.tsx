"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-pop border p-8 text-center space-y-4">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-rose-100 text-rose-600">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-black">문제가 생겼어요</h1>
        <p className="text-base text-ink-soft">
          잠시 후 다시 시도해 주세요. 계속 반복되면 담임목사님이나 관리자에게 알려 주세요.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" size="lg" onClick={() => reset()}>
            <RotateCcw className="h-5 w-5" /> 다시 시도
          </Button>
          <Button size="lg" href="/">
            <Home className="h-5 w-5" /> 처음으로
          </Button>
        </div>
      </div>
    </div>
  );
}
