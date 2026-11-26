import Link from "next/link";
import { Feather } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { softCardClassName } from "./photo-page-styles";

// A friendly "nothing here yet" note on a photo-backed popup, with an
// optional button for the next step (a link, or any control as children).
export function PopupEmptyState({
  message,
  action,
  children,
}: {
  message: string;
  action?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className={`${softCardClassName} flex flex-col items-center gap-3 px-4 py-8 text-center`}>
      <Feather className="size-7 text-amber-700/60" aria-hidden />
      <p className="font-handwritten text-base">{message}</p>
      {action && (
        <Link href={action.href} prefetch className={`${buttonVariants({ size: "sm" })} rounded-full`}>
          {action.label}
        </Link>
      )}
      {children}
    </div>
  );
}
