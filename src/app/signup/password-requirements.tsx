import { CheckIcon, CircleIcon } from "lucide-react";
import { passwordRequirements } from "@/lib/auth-schemas";

/** Lists the password rules, ticking each one off as `password` meets it. */
export function PasswordRequirements({ id, password }: { id?: string; password: string }) {
  return (
    <ul id={id} className="flex flex-col gap-0.5 text-xs">
      {passwordRequirements.map((requirement) => {
        const met = requirement.isMet(password);
        return (
          <li
            key={requirement.label}
            data-met={met}
            className={`flex items-center gap-1.5 ${met ? "text-green-700" : "text-muted-foreground"}`}
          >
            {met ? (
              <CheckIcon className="size-3.5" aria-hidden />
            ) : (
              <CircleIcon className="size-3.5" aria-hidden />
            )}
            <span className="sr-only">{met ? "Met: " : "Not met yet: "}</span>
            {requirement.label}
          </li>
        );
      })}
    </ul>
  );
}
