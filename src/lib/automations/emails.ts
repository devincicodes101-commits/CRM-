// Branded HTML email templates shared by all automations.
// Kept dependency-free (inline styles) so it renders in any mail client.

const FALLBACK_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "BuildStream";
const FALLBACK_COLOR = "#f97316";

export type EmailBrand = {
  companyName?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  email?: string | null;
  phone?: string | null;
};

// A process-wide default so every automation email is branded without threading
// the brand through each call. Runners set this once (from company_settings).
let defaultBrand: EmailBrand | null = null;
export function setEmailBrand(brand: EmailBrand | null) {
  defaultBrand = brand;
}

export const money = (n: number | null | undefined) =>
  `£${Number(n ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

export function brandedEmail(opts: {
  heading: string;
  body: string; // inner HTML
  cta?: { label: string; url: string };
  brand?: EmailBrand;
}): string {
  const { heading, body, cta } = opts;
  const b = opts.brand ?? defaultBrand ?? {};
  const name = b.companyName || FALLBACK_NAME;
  const color = b.brandColor || FALLBACK_COLOR;

  const header = b.logoUrl
    ? `<img src="${esc(b.logoUrl)}" alt="${esc(name)}" style="max-height:40px;display:block">`
    : `<span style="color:#fff;font-size:19px;font-weight:700">${esc(name)}</span>`;
  const tagline = b.tagline
    ? `<p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:12px">${esc(b.tagline)}</p>`
    : "";
  const contact = [b.phone, b.email].filter(Boolean).map((x) => esc(x)).join("  ·  ");

  return `
  <div style="background:#f4f4f4;padding:24px 0;font-family:Inter,Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #eee">
      <div style="background:#1a1a1a;padding:20px 28px">${header}${tagline}</div>
      <div style="padding:28px;color:#111">
        <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937">${heading}</h2>
        <div style="font-size:14px;line-height:1.6;color:#374151">${body}</div>
        ${
          cta
            ? `<p style="margin:24px 0 4px"><a href="${cta.url}" style="background:${color};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${esc(cta.label)}</a></p>`
            : ""
        }
      </div>
      <div style="background:${color};padding:16px 28px;text-align:center">
        <p style="margin:0;color:rgba(255,255,255,0.95);font-size:12px">${esc(name)}${contact ? `  ·  ${contact}` : ""}</p>
      </div>
    </div>
  </div>`;
}
