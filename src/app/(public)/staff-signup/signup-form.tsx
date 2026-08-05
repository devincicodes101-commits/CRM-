"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { submitStaffSignup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StaffSignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const r = await submitStaffSignup({ name, email });
      if ("error" in r) toast.error(r.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 p-6 text-center space-y-2">
        <CheckCircle className="size-10 text-green-600 dark:text-green-400 mx-auto" />
        <p className="font-semibold text-green-800 dark:text-green-200 text-lg">Request Received</p>
        <p className="text-sm text-green-700 dark:text-green-300">
          Thanks — the office will review your request and send you an invite once approved.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-background p-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
      </div>
      <Button className="w-full h-11" onClick={submit} disabled={pending || !name || !email}>
        {pending ? "Sending…" : "Request Access"}
      </Button>
    </div>
  );
}
