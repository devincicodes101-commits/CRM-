// Branded HTML email templates shared by all automations.
// Kept dependency-free (inline styles) so it renders in any mail client.

const BRAND = process.env.NEXT_PUBLIC_COMPANY_NAME ?? "BuildStream";
const PRIMARY = "#f97316";

export const money = (n: number | null | undefined) =>
  `£${Number(n ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

export function brandedEmail(opts: {
  heading: string;
  body: string; // inner HTML
  cta?: { label: string; url: string };
}): string {
  const { heading, body, cta } = opts;
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h2 style="margin:0 0 16px;font-size:20px">${heading}</h2>
    <div style="font-size:14px;line-height:1.6;color:#333">${body}</div>
    ${
      cta
        ? `<p style="margin-top:24px"><a href="${cta.url}" style="background:${PRIMARY};color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${cta.label}</a></p>`
        : ""
    }
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="font-size:12px;color:#999">${BRAND}</p>
  </div>`;
}
