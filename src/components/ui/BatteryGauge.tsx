import { memo } from "react";

// Segmented Arc Math
// We center a 220° arc at the top. 
// A 220° arc centered at 12 o'clock starts at 160° and ends at 20°.

const SEGMENTS = 5;
const SWEEP = 220;
const GAP = 8; 
const SEGMENT_ARC = (SWEEP - (SEGMENTS - 1) * GAP) / SEGMENTS;

const CX = 18;
const CY = 18;
const R = 13;

function gaugeColor(v: number): string {
  if (v >= 70) return "#34d399"; // emerald-400
  if (v >= 30) return "#fbbf24"; // amber-400
  return "#f87171";              // red-400
}

type BatteryGaugeProps = {
  value: number;
  size?: number;
};

function BatteryGaugeInner({ value, size = 44 }: BatteryGaugeProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const color = gaugeColor(v);
  const fontSize = v === 100 ? "5.5" : "7.5";

  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      fill="none"
      className="overflow-visible"
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 
        Rotate the entire group to center the 220° arc at the top.
        Standard SVG circle starts at 3 o'clock (0°).
        To center 220° at top (270°), we start at 160°.
      */}
      <g transform={`rotate(160 ${CX} ${CY})`}>
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const segmentMin = i * 20;
          const segmentFill = Math.max(0, Math.min(1, (v - segmentMin) / 20));
          const rotation = i * (SEGMENT_ARC + GAP);

          return (
            <g key={i} transform={`rotate(${rotation} ${CX} ${CY})`}>
              
              <circle
                cx={CX}
                cy={CY}
                r={R}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth={4.5}
                strokeLinecap="round"
                pathLength={360}
                strokeDasharray={`${SEGMENT_ARC} ${360 - SEGMENT_ARC}`}
                strokeDashoffset={0}
              />
              
              
              {segmentFill > 0 && (
                <circle
                  cx={CX}
                  cy={CY}
                  r={R}
                  stroke={color}
                  strokeWidth={4.5}
                  strokeLinecap="round"
                  pathLength={360}
                  strokeDasharray={`${SEGMENT_ARC * segmentFill} 360`}
                  strokeDashoffset={0}
                  filter="url(#glow)"
                  style={{
                    transition: "stroke-dasharray 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.3s ease",
                  }}
                />
              )}
            </g>
          );
        })}
      </g>

      
      <text
        x={CX}
        y={CY + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        className="font-bold tracking-tight"
        style={{ 
          fontSize,
          fontFamily: "ui-monospace, monospace",
          opacity: 0.9 
        }}
      >
        {v}
      </text>
    </svg>
  );
}

export const BatteryGauge = memo(BatteryGaugeInner);
