"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Click-based date + time picker. Value is a datetime-local string
// ("YYYY-MM-DDTHH:mm" or "") so it drops straight into the existing forms.
// Pick the day from a calendar and the time from a 15-minute dropdown — no typing.

const pad = (n: number) => String(n).padStart(2, "0");

// 00:00 → 23:45 in 15-minute steps.
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${pad(h)}:${pad(m)}`;
});

function parseValue(value: string): { date: Date | undefined; time: string } {
  if (!value) return { date: undefined, time: "" };
  const [datePart, timePart = ""] = value.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const date = y && mo && d ? new Date(y, mo - 1, d) : undefined;
  return { date, time: timePart.slice(0, 5) };
}

function buildValue(date: Date | undefined, time: string): string {
  if (!date) return "";
  const t = time || "08:00";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${t}`;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  ariaInvalid?: boolean;
};

export function DateTimePicker({
  value,
  onChange,
  id,
  placeholder = "Pick a date & time",
  ariaInvalid,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const { date, time } = parseValue(value);

  const label = date
    ? `${format(date, "EEE d MMM yyyy")}${time ? ` · ${time}` : ""}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={ariaInvalid}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 size-4 shrink-0" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(d) => onChange(buildValue(d ?? undefined, time))}
          autoFocus
        />
        <div className="flex items-center gap-2 border-t p-3">
          <span className="text-sm text-muted-foreground">Time</span>
          <Select
            value={time || null}
            onValueChange={(t) => onChange(buildValue(date ?? new Date(), typeof t === "string" ? t : ""))}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="--:--" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
