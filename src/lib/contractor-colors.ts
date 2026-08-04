// Deterministic per-contractor colour (Base44 §14). Same contractor id always
// maps to the same hue — never random — so calendar blocks are recognisable.

const PALETTE = [
  "#2563eb", "#16a34a", "#db2777", "#9333ea", "#ea580c",
  "#0891b2", "#ca8a04", "#dc2626", "#4f46e5", "#0d9488",
  "#7c3aed", "#c026d3", "#65a30d", "#e11d48", "#0284c7",
];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function contractorColor(contractorId: string | null | undefined): string | null {
  if (!contractorId) return null;
  return PALETTE[hash(contractorId) % PALETTE.length];
}
