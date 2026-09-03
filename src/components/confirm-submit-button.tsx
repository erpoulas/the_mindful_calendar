"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  confirmMessage,
  children,
  ...props
}: ComponentProps<typeof Button> & { confirmMessage: string }) {
  return (
    <Button
      type="submit"
      variant="destructive"
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
