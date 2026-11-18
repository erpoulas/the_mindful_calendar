"use client";

import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";

export function PanelSheet({
  open,
  title,
  hideVisibleTitle,
  size,
  backgroundImage,
  children,
}: {
  open: boolean;
  title: string;
  hideVisibleTitle?: boolean;
  size?: "side" | "wide" | "center";
  backgroundImage?: {
    src: string;
    width: number;
    height: number;
    contentInsetClassName?: string;
  };
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
      hideVisibleTitle={hideVisibleTitle}
      size={size}
      backgroundImage={backgroundImage}
    >
      {children}
    </Sheet>
  );
}
