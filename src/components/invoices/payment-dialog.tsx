"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { recordPayment } from "@/app/(protected)/invoices/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Method = "bank_transfer" | "credit_card" | "direct_debit";

type Props = {
  invoiceId: string;
  total: number;
  amountPaid: number;
};

export function PaymentDialog({ invoiceId, total, amountPaid }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String((total - amountPaid).toFixed(2)));
  const [method, setMethod] = useState<Method>("bank_transfer");
  const [pending, startTransition] = useTransition();

  const balance = total - amountPaid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const paid = parseFloat(amount);
    if (isNaN(paid) || paid <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    startTransition(async () => {
      const result = await recordPayment(invoiceId, amountPaid + paid, method, total);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          paid >= balance ? "Invoice marked as fully paid" : `Payment of £${paid.toFixed(2)} recorded`
        );
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        Record Payment
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="text-sm text-muted-foreground">
            Balance due: <span className="font-semibold text-foreground">£{Math.max(0, balance).toFixed(2)}</span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Amount Received (£)</Label>
            <Input
              id="pay-amount"
              type="number"
              min="0.01"
              step="0.01"
              max={balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="direct_debit">Direct Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}