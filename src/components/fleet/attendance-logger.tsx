"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createAttendance } from "@/app/(protected)/fleet/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "early_leave", label: "Early Leave" },
] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function localTimeToISO(date: string, time: string) {
  if (!time) return undefined;
  return new Date(`${date}T${time}`).toISOString();
}

export function AttendanceLogger() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState<string>("present");
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setName("");
    setDate(todayISO());
    setStatus("present");
    setClockIn("");
    setClockOut("");
    setNotes("");
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Operative name is required"); return; }

    const clockInISO = localTimeToISO(date, clockIn);
    const clockOutISO = localTimeToISO(date, clockOut);
    let hours_worked: number | undefined;
    if (clockInISO && clockOutISO) {
      const diff = (new Date(clockOutISO).getTime() - new Date(clockInISO).getTime()) / 3600000;
      hours_worked = parseFloat(diff.toFixed(2));
    }

    startTransition(async () => {
      const result = await createAttendance({
        operative_name: name.trim(),
        attendance_date: date,
        status,
        clock_in_time: clockInISO,
        clock_out_time: clockOutISO,
        hours_worked,
        notes: notes.trim() || undefined,
      });
      if (result?.error) toast.error(result.error);
      else { toast.success("Attendance logged"); reset(); }
    });
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Log Attendance
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-4 space-y-4 max-w-2xl"
    >
      <h2 className="font-medium text-sm">Log Attendance Entry</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="att-name">Operative Name *</Label>
          <Input
            id="att-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="att-date">Date</Label>
          <Input
            id="att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "present")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="att-notes">Notes</Label>
          <Input
            id="att-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="att-in">Clock In Time</Label>
          <Input
            id="att-in"
            type="time"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="att-out">Clock Out Time</Label>
          <Input
            id="att-out"
            type="time"
            value={clockOut}
            onChange={(e) => setClockOut(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save Entry"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}