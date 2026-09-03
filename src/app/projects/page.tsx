import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { listIntentions } from "@/lib/intentions";
import { listProjects } from "@/lib/projects";
import { NewProjectForm } from "./new-project-form";

const STATUS_LABEL = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export default async function ProjectsPage() {
  const userId = await getCurrentUserId();
  const [projects, intentions] = await Promise.all([
    listProjects(db, userId),
    listIntentions(db, userId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-zinc-600 underline">
        ← Dashboard
      </Link>

      <h1 className="text-2xl font-semibold">Projects</h1>

      <ul className="flex flex-col gap-2">
        {projects.length === 0 && (
          <p className="text-sm text-zinc-600">No projects yet — add one below.</p>
        )}
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              href={`/projects/${project.id}`}
              className="flex items-center justify-between rounded border px-3 py-2 hover:bg-zinc-50"
            >
              <span>{project.title}</span>
              <span className="text-sm text-zinc-500">{STATUS_LABEL[project.status]}</span>
            </Link>
          </li>
        ))}
      </ul>

      <NewProjectForm intentions={intentions} />
    </div>
  );
}
