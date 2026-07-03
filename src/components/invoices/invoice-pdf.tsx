"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Invoice } from "@/lib/schemas/invoices";

type Props = { invoice: Invoice };

export function InvoicePdfButton({ invoice }: Props) {
  const [pending, startTransition] = useTransition();

  function downloadPdf() {
    startTransition(async () => {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const margin = 20;
      const col2 = pageW / 2 + 10;
      let y = 20;

      // Header
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", margin, y);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Invoice #${invoice.invoice_number}`, pageW - margin, y, { align: "right" });
      y += 6;
      doc.text(
        `Date: ${new Date(invoice.created_date).toLocaleDateString("en-GB")}`,
        pageW - margin,
        y,
        { align: "right" }
      );
      if (invoice.due_date) {
        y += 5;
        doc.text(
          `Due: ${new Date(invoice.due_date).toLocaleDateString("en-GB")}`,
          pageW - margin,
          y,
          { align: "right" }
        );
      }

      // Divider
      y = 40;
      doc.setTextColor(0);
      doc.setDrawColor(220);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      // Billed To
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120);
      doc.text("BILLED TO", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(invoice.customer_name, margin, y);
      if (invoice.customer_email) { y += 5; doc.text(invoice.customer_email, margin, y); }
      if (invoice.customer_address) {
        y += 5;
        const addrLines = doc.splitTextToSize(invoice.customer_address, 80);
        doc.text(addrLines, margin, y);
        y += (addrLines.length - 1) * 5;
      }

      // Status badge area
      y = 40 + 8;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120);
      doc.text("STATUS", col2, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(invoice.status.toUpperCase(), col2, y);

      // Line items table
      y = 80;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120);
      doc.text("DESCRIPTION", margin, y);
      doc.text("QTY", 120, y, { align: "right" });
      doc.text("UNIT PRICE", 155, y, { align: "right" });
      doc.text("TOTAL", pageW - margin, y, { align: "right" });
      y += 2;
      doc.setDrawColor(220);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      for (const item of invoice.items ?? []) {
        doc.text(item.service_name, margin, y);
        if (item.description) {
          y += 4;
          doc.setFontSize(8);
          doc.setTextColor(130);
          const descLines = doc.splitTextToSize(item.description, 80);
          doc.text(descLines, margin, y);
          y += (descLines.length - 1) * 4;
          doc.setFontSize(10);
          doc.setTextColor(0);
        }
        doc.text(String(item.quantity), 120, y, { align: "right" });
        doc.text(`£${Number(item.unit_price).toFixed(2)}`, 155, y, { align: "right" });
        doc.text(`£${Number(item.total).toFixed(2)}`, pageW - margin, y, { align: "right" });
        y += 7;

        // Page break guard
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
      }

      // Totals
      y += 4;
      doc.setDrawColor(220);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      const totals: [string, string][] = [
        ["Subtotal", `£${Number(invoice.subtotal).toFixed(2)}`],
      ];
      if (Number(invoice.discount_amount) > 0) {
        totals.push(["Discount", `-£${Number(invoice.discount_amount).toFixed(2)}`]);
      }
      totals.push([`VAT (${invoice.vat_rate}%)`, `£${Number(invoice.vat_amount).toFixed(2)}`]);

      doc.setFontSize(9);
      for (const [label, value] of totals) {
        doc.setTextColor(100);
        doc.text(label, 145, y);
        doc.setTextColor(0);
        doc.text(value, pageW - margin, y, { align: "right" });
        y += 6;
      }

      // Grand total
      y += 2;
      doc.setDrawColor(0);
      doc.line(140, y, pageW - margin, y);
      y += 6;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("TOTAL", 145, y);
      doc.text(`£${Number(invoice.total).toFixed(2)}`, pageW - margin, y, { align: "right" });

      if (Number(invoice.amount_paid) > 0) {
        y += 6;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("Amount Paid", 145, y);
        doc.text(`£${Number(invoice.amount_paid).toFixed(2)}`, pageW - margin, y, { align: "right" });
        y += 6;
        const balance = Number(invoice.total) - Number(invoice.amount_paid);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(balance > 0 ? 200 : 0, 0, 0);
        doc.text("Balance Due", 145, y);
        doc.text(`£${Math.max(0, balance).toFixed(2)}`, pageW - margin, y, { align: "right" });
      }

      // Notes
      if (invoice.notes) {
        y += 14;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(120);
        doc.text("NOTES", margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        doc.setFontSize(9);
        const noteLines = doc.splitTextToSize(invoice.notes, pageW - margin * 2);
        doc.text(noteLines, margin, y);
      }

      doc.save(`invoice-${invoice.invoice_number}.pdf`);
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={downloadPdf}>
      <Download className="size-4" />
      {pending ? "Generating…" : "Download PDF"}
    </Button>
  );
}