"use client";

import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";

export function PanelSheet({
  open,
  title,
  size,
  children,
}: {
  open: boolean;
  title: string;
  size?: "side" | "wide" | "center";
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) router.push("/dashboard");
      }}
      title={title}
      size={size}
    >
      {children}
    </Sheet>
  );
}
