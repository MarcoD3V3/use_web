"use client";

import { cn } from "@/lib/utils";

type BarPoint = { label: string; total: number };

type Props = {
  data: BarPoint[];
  className?: string;
  height?: number;
};

export function PortalBarChart({ data, className, height = 72 }: Props) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.total)));
  const hasNegative = data.some((d) => d.total < 0);

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${data.length * 24} ${height}`} className="w-full h-[72px]" preserveAspectRatio="none">
        {data.map((point, i) => {
          const h = (Math.abs(point.total) / max) * (height * 0.72);
          const x = i * 24 + 4;
          const y = hasNegative
            ? point.total >= 0
              ? height / 2 - h
              : height / 2
            : height - h - 4;
          const fill = point.total >= 0 ? "#7c83ff" : "#f87171";
          return (
            <g key={point.label}>
              <rect
                x={x}
                y={y}
                width={16}
                height={Math.max(2, h)}
                rx={4}
                fill={fill}
                opacity={point.total === 0 ? 0.15 : 0.85}
              />
            </g>
          );
        })}
        {hasNegative && (
          <line x1={0} y1={height / 2} x2={data.length * 24} y2={height / 2} stroke="#ffffff12" strokeWidth={1} />
        )}
      </svg>
      <div className="flex justify-between gap-1 mt-2">
        {data.map((point) => (
          <span key={point.label} className="flex-1 text-center text-[10px] text-portal-muted truncate">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

type RingProps = {
  percent: number;
  size?: number;
  label?: string;
  sublabel?: string;
};

export function PortalProgressRing({ percent, size = 88, label, sublabel }: RingProps) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff0a" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#7c83ff"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        {label && <span className="text-lg font-semibold text-white tabular-nums">{label}</span>}
        {sublabel && <span className="text-[10px] text-portal-muted leading-tight mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
}

type DonutProps = {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
};

export function PortalDonutChart({ segments, size = 80 }: DonutProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="-rotate-90 shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff0a" strokeWidth={8} />
        {segments.map((seg) => {
          const len = (seg.value / total) * c;
          const el = (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={8}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      <ul className="space-y-1.5 min-w-0">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-portal-muted truncate">{seg.label}</span>
            <span className="ml-auto tabular-nums text-portal-text/90">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
