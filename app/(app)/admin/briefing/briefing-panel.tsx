"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, HeartPulse, PartyPopper, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/dates";

interface Briefing {
  text: string;
  care: { where: string; reason: string; text: string }[];
  joy: { where: string; keyword: string; text: string }[];
  generatedAt?: string | null;
}

/** 아주 단순한 마크다운 렌더 (##, -, **) */
function renderMd(md: string) {
  return md.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h3 key={i} className="mt-4 text-xl font-black text-brand-800">{line.slice(3)}</h3>;
    if (line.startsWith("# ")) return <h2 key={i} className="mt-4 text-2xl font-black">{line.slice(2)}</h2>;
    const bold = (s: string) => s.split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith("**") ? <b key={j}>{p.slice(2, -2)}</b> : p));
    if (/^\s*[-•]\s+/.test(line)) return <li key={i} className="ml-5 list-disc text-lg leading-relaxed">{bold(line.replace(/^\s*[-•]\s+/, ""))}</li>;
    if (!line.trim()) return <div key={i} className="h-2" />;
    return <p key={i} className="text-lg leading-relaxed">{bold(line)}</p>;
  });
}

export function BriefingPanel({ sunday, enabled, initial }: { sunday: string; enabled: boolean; initial: Briefing | null }) {
  const router = useRouter();
  const [data, setData] = useState<Briefing | null>(initial);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await api<Briefing>("/api/admin/briefing", { body: { sunday } });
      setData({ ...res, generatedAt: new Date().toISOString() });
      toast.success("브리핑을 만들었어요");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) {
    return (
      <Card>
        <EmptyState icon={<Sparkles className="h-8 w-8" />} title="AI 브리핑 기능이 꺼져 있어요" description="Vercel 환경변수에 ANTHROPIC_API_KEY 를 넣으면 이 기능이 켜져요. 없어도 다른 기능은 모두 정상이에요." />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rise-in">
        <p className="text-base text-ink-soft">{data?.generatedAt ? `마지막 생성: ${formatDateTime(data.generatedAt)}` : "아직 이 주 브리핑이 없어요"}</p>
        <Button size="lg" variant="gold" onClick={generate} loading={loading}>
          {!loading && (data ? <RefreshCw className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />)}
          {loading ? "만드는 중... (30초 정도)" : data ? "다시 만들기" : "브리핑 만들기"}
        </Button>
      </div>

      {data && (
        <>
          <Card className="rise-in rise-in-2">
            <CardHeader>
              <CardTitle icon={<Sparkles className="h-6 w-6 text-gold-500" />}>주간 목회 브리핑</CardTitle>
              <CardDescription>보고서 내용을 AI가 정리한 것이므로 참고용이에요. 중요한 내용은 원문을 확인해 주세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">{renderMd(data.text)}</div>
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rise-in rise-in-3">
              <CardHeader>
                <CardTitle icon={<HeartPulse className="h-6 w-6 text-rose-500" />}>돌봄이 필요한 분 ({data.care.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.care.length === 0 && <p className="text-base text-ink-soft">긴급 소식이 없어요.</p>}
                {data.care.map((c, i) => (
                  <div key={i} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge tone="rose">{c.reason}</Badge>
                      <span className="font-bold">{c.where}</span>
                    </div>
                    <p className="mt-1 text-base">{c.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rise-in rise-in-3">
              <CardHeader>
                <CardTitle icon={<PartyPopper className="h-6 w-6 text-amber-500" />}>기쁜 소식 ({data.joy.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.joy.length === 0 && <p className="text-base text-ink-soft">이번 주 기쁜 소식 키워드가 없어요.</p>}
                {data.joy.map((c, i) => (
                  <div key={i} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge tone="amber">{c.keyword}</Badge>
                      <span className="font-bold">{c.where}</span>
                    </div>
                    <p className="mt-1 text-base">{c.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
