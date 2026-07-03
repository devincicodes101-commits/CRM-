"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

type ButtonProps = ComponentProps<typeof Button> & VariantProps<typeof buttonVariants>;

type Props = Omit<ButtonProps, "onClick"> & {
  action: () => Promise<{ error: string } | void>;
};

export function AsyncButton({ action, children, disabled, ...props }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await action();
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button {...props} disabled={disabled || pending} onClick={handleClick}>
      {children}
    </Button>
  );
}