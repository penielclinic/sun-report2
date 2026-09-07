"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PeriodPoint } from "@/lib/stats.server";
import { ATTEND_COLS } from "@/types/database";

const COLORS: Record<string, string> = {
  attend_samil: "#6366f1",
  attend_friday: "#8b5cf6",
  attend_sun_day: "#f59e0b",
  attend_sun_eve: "#f43f5e",
  attend_sun: "#10b981",
  evangelism: "#f97316",
};
const LABELS: Record<string, string> = Object.fromEntries(ATTEND_COLS.map((c) => [c.key, c.label]));

const axis = { fontSize: 14, fontWeight: 700, fill: "#4b5568" };
const tooltipStyle = { fontSize: 16, borderRadius: 16, border: "1px solid #e5e9f2", boxShadow: "0 8px 24px -8px rgba(29,47,133,.25)" };

export function StatisticsCharts({ points, mission, periodLabel }: { points: PeriodPoint[]; mission: { name: string; attend: number }[]; periodLabel: string }) {
  const empty = points.length === 0;
  return (
    <>
      <Card className="rise-in rise-in-2">
        <CardHeader>
          <CardTitle>항목별 참석 추이</CardTitle>
          <CardDescription>{periodLabel} · 막대 하나가 한 기간이에요</CardDescription>
        </CardHeader>
        <CardContent>
          {empty ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
                <XAxis dataKey="label" tick={axis} />
                <YAxis tick={axis} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v}명`, LABELS[String(n)] ?? n]} />
                <Legend formatter={(v) => LABELS[v] ?? v} wrapperStyle={{ fontSize: 14, fontWeight: 700 }} />
                {ATTEND_COLS.map((c) => (
                  <Bar key={c.key} dataKey={c.key} stackId="a" fill={COLORS[c.key]} radius={c.key === "evangelism" ? [6, 6, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rise-in rise-in-3">
          <CardHeader>
            <CardTitle>주일낮 · 순모임 · 전도</CardTitle>
          </CardHeader>
          <CardContent>
            {empty ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
                  <XAxis dataKey="label" tick={axis} />
                  <YAxis tick={axis} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v}명`, LABELS[String(n)] ?? n]} />
                  <Legend formatter={(v) => LABELS[v] ?? v} wrapperStyle={{ fontSize: 14, fontWeight: 700 }} />
                  <Line type="monotone" dataKey="attend_sun_day" stroke={COLORS.attend_sun_day} strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="attend_sun" stroke={COLORS.attend_sun} strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="evangelism" stroke={COLORS.evangelism} strokeWidth={3} strokeDasharray="6 3" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rise-in rise-in-3">
          <CardHeader>
            <CardTitle>성경 읽기 (장)</CardTitle>
          </CardHeader>
          <CardContent>
            {empty ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
                  <XAxis dataKey="label" tick={axis} />
                  <YAxis tick={axis} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}장`, "성경"]} />
                  <Bar dataKey="bible" fill="#059669" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rise-in rise-in-4">
        <CardHeader>
          <CardTitle>선교회별 주일낮 참석 (최근 기간)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mission} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
              <XAxis dataKey="name" tick={axis} interval={0} />
              <YAxis tick={axis} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}명`, "주일낮"]} />
              <Bar dataKey="attend" fill="#d9ad2e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

function Empty() {
  return <p className="py-10 text-center text-lg text-ink-soft">아직 데이터가 없어요</p>;
}
