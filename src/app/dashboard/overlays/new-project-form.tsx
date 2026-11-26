"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CalendarDays, Target } from "lucide-react";
import type { ProjectFormState } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { IntentionChips, toggleIntentionId, type IntentionChoice } from "./intention-chips";
import { pageHeadingClassName } from "./photo-page-styles";

const writeOnPageClass =
  "field-sizing-content block w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/60";

/**
 * A blank project page under the tabs, laid out like a saved one: type the
 * name and the end goal straight onto the page, tap the intentions it serves,
 * and optionally pick a due date. A project needs a name, a real end goal and
 * at least one intention, so it's only made once those are in.
 */
export function NewProjectForm({
  intentions,
  createAction,
}: {
  intentions: IntentionChoice[];
  createAction: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
}) {
  const [state, formAction, pending] = useActionState(createAction, undefined);
  const [title, setTitle] = useState("");
  const [endGoal, setEndGoal] = useState("");
  const [intentionIds, setIntentionIds] = useState<string[]>([]);
  const ready = title.trim() !== "" && endGoal.trim() !== "" && intentionIds.length > 0;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <textarea
          name="title"
          rows={1}
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          // A name is one line.
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder="Project name"
          aria-label="Project name"
          className={`${pageHeadingClassName} ${writeOnPageClass} wrap-anywhere`}
        />
        {state?.errors?.title && <p className="text-sm text-red-600">{state.errors.title[0]}</p>}
      </div>

      <div>
        <label className="flex items-start gap-2">
          <Target className="mt-1 size-4 shrink-0 text-amber-700/70" aria-hidden />
          <span className="sr-only">End goal</span>
          <textarea
            name="endGoal"
            rows={1}
            value={endGoal}
            onChange={(event) => setEndGoal(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            placeholder="What does done look like? e.g. Run the Cedar Falls 5k on Oct 12"
            className={`${writeOnPageClass} text-[15px]`}
          />
        </label>
        {state?.errors?.endGoal && <p className="text-sm text-red-600">{state.errors.endGoal[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Counts toward
        </p>
        {intentions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            A project serves an intention.{" "}
            <Link href={dashboardRoutes.intentions()} className="underline">
              Add an intention
            </Link>{" "}
            first.
          </p>
        ) : (
          <IntentionChips
            intentions={intentions}
            selectedIds={intentionIds}
            onToggle={(id) => setIntentionIds((ids) => toggleIntentionId(ids, id))}
          />
        )}
        {intentionIds.map((id) => (
          <input key={id} type="hidden" name="intentionIds" value={id} />
        ))}
        {state?.errors?.intentionIds && (
          <p className="text-sm text-red-600">{state.errors.intentionIds[0]}</p>
        )}
      </div>

      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="size-4" aria-hidden />
        Due (optional)
        <input type="date" name="dueDate" className="rounded-sm bg-primary/5 px-1 outline-none" />
      </label>

      <Button type="submit" size="sm" disabled={!ready || pending} className="self-start rounded-full">
        {pending ? "Starting..." : "Start project"}
      </Button>
    </form>
  );
}
