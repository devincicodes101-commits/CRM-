"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type Props = { url: string; label?: string } & Omit<
  React.ComponentPropsWithoutRef<"button"> & VariantProps<typeof buttonVariants>,
  "onClick"
>;

export function CopyLinkButton({ url, label = "Copy Link", ...props }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button {...props} onClick={handleCopy}>
      {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}