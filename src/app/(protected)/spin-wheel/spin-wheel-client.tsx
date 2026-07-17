"use client";

import { useState, useRef } from "react";

type Prize = { id: string; prize_description: string; prize_emoji: string | null; wheel_type: string };

const WHEEL_COLORS = [
  "#f97316", "#fb923c", "#fdba74",
  "#fcd34d", "#86efac", "#6ee7b7",
  "#67e8f9", "#93c5fd", "#c4b5fd",
  "#f9a8d4",
];

export function SpinWheelClient({ prizes }: { prizes: Prize[] }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Prize | null>(null);
  const spinRef = useRef(0);

  const displayPrizes = prizes.length > 0
    ? prizes
    : [
        { id: "1", prize_description: "Extra day off", prize_emoji: "🏖️", wheel_type: "crm" },
        { id: "2", prize_description: "£50 Amazon voucher", prize_emoji: "🎁", wheel_type: "crm" },
        { id: "3", prize_description: "Team lunch", prize_emoji: "🍕", wheel_type: "crm" },
        { id: "4", prize_description: "Early finish Friday", prize_emoji: "⏰", wheel_type: "crm" },
        { id: "5", prize_description: "£25 gift card", prize_emoji: "💳", wheel_type: "crm" },
        { id: "6", prize_description: "Better luck next time!", prize_emoji: "🤞", wheel_type: "crm" },
      ];

  const segmentAngle = 360 / displayPrizes.length;

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setWinner(null);

    const extraSpins = 5 + Math.floor(Math.random() * 5); // 5-10 full rotations
    const targetSegment = Math.floor(Math.random() * displayPrizes.length);
    const targetAngle = 360 - (targetSegment * segmentAngle + segmentAngle / 2);
    const totalRotation = spinRef.current + extraSpins * 360 + targetAngle;

    spinRef.current = totalRotation;
    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinner(displayPrizes[targetSegment]);
    }, 4000);
  }

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  function polarToCartesian(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function segmentPath(index: number) {
    const startAngle = index * segmentAngle;
    const endAngle = startAngle + segmentAngle;
    const start = polarToCartesian(startAngle, r);
    const end = polarToCartesian(endAngle, r);
    const largeArc = segmentAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  }

  function labelPosition(index: number) {
    const angle = index * segmentAngle + segmentAngle / 2;
    return polarToCartesian(angle, r * 0.65);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Pointer */}
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-0 h-0"
          style={{ borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "24px solid #f97316" }} />

        {/* Wheel */}
        <svg
          width={size}
          height={size}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.15))",
          }}
        >
          {displayPrizes.map((prize, i) => {
            const pos = labelPosition(i);
            return (
              <g key={prize.id}>
                <path
                  d={segmentPath(i)}
                  fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={pos.x}
                  y={pos.y - 6}
                  textAnchor="middle"
                  fontSize="18"
                  dominantBaseline="middle"
                >
                  {prize.prize_emoji ?? "🎁"}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill="white"
                  fontWeight="600"
                  dominantBaseline="middle"
                  style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }}
                >
                  {prize.prize_description.length > 12
                    ? prize.prize_description.slice(0, 12) + "…"
                    : prize.prize_description}
                </text>
              </g>
            );
          })}
          {/* Center circle */}
          <circle cx={cx} cy={cy} r={22} fill="white" stroke="#e5e7eb" strokeWidth="2" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="16">🎯</text>
        </svg>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning}
        className="px-10 py-3.5 rounded-2xl text-white font-bold text-lg shadow-lg transition-all disabled:opacity-60 disabled:scale-95 active:scale-95"
        style={{ background: spinning ? "#9ca3af" : "var(--primary)" }}
      >
        {spinning ? "Spinning…" : "SPIN!"}
      </button>

      {/* Winner banner */}
      {winner && (
        <div className="w-full rounded-2xl border-2 border-primary bg-orange-50 p-6 text-center animate-bounce-once">
          <p className="text-4xl mb-2">{winner.prize_emoji ?? "🎁"}</p>
          <p className="text-xl font-bold text-primary">You won!</p>
          <p className="text-lg font-semibold mt-1">{winner.prize_description}</p>
          <p className="text-xs text-muted-foreground mt-2">Screenshot this and show your manager 🎉</p>
        </div>
      )}

      {/* Prize list */}
      <div className="w-full rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b">
          <p className="font-semibold text-sm">Available Prizes</p>
        </div>
        <div className="divide-y">
          {displayPrizes.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
              <span className="text-xl">{p.prize_emoji ?? "🎁"}</span>
              <span className="text-sm">{p.prize_description}</span>
              <span className="ml-auto w-3 h-3 rounded-full shrink-0" style={{ background: WHEEL_COLORS[i % WHEEL_COLORS.length] }} />
            </div>
          ))}
        </div>
        {prizes.length === 0 && (
          <p className="px-5 py-3 text-xs text-muted-foreground border-t">
            Sample prizes shown — add real prizes in Settings → Bonus & Prizes.
          </p>
        )}
      </div>
    </div>
  );
}
