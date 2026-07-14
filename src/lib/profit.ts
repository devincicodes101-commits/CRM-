// Simplified job-profit calculation (Base44 profitUtils equivalent).
// Profit = job value − materials cost − approved receipts for the job.
// Labour can be layered in later once hours/labour-rate are tracked per job.

type Material = { quantity?: number; unit_cost?: number | null };
type JobLike = {
  id: string;
  total_value?: number | null;
  materials_used?: Material[] | null;
};
type ReceiptLike = {
  job_id: string;
  amount_gbp?: number | null;
  status?: string | null;
};

export function materialsCost(job: JobLike): number {
  return (job.materials_used ?? []).reduce(
    (sum, m) => sum + (m.quantity ?? 0) * (m.unit_cost ?? 0),
    0
  );
}

export function calcJobProfit(job: JobLike, receipts: ReceiptLike[] = []): number {
  const revenue = job.total_value ?? 0;
  const materials = materialsCost(job);
  const receiptCost = receipts
    .filter((r) => r.job_id === job.id && r.status === "approved")
    .reduce((sum, r) => sum + (r.amount_gbp ?? 0), 0);
  return revenue - materials - receiptCost;
}

export function calcMargin(job: JobLike, receipts: ReceiptLike[] = []): number {
  const revenue = job.total_value ?? 0;
  if (revenue <= 0) return 0;
  return (calcJobProfit(job, receipts) / revenue) * 100;
}
