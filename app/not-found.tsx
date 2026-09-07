import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-pop border p-8 text-center space-y-4">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-100 text-brand-600">
          <SearchX className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-black">페이지를 찾을 수 없어요</h1>
        <p className="text-base text-ink-soft">주소가 잘못되었거나 삭제된 내용이에요.</p>
        <Button size="lg" href="/" full>
          처음 화면으로
        </Button>
      </div>
    </div>
  );
}
