import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addProjectTaskAction,
  completeProjectAction,
  pauseProjectAction,
  resumeProjectAction,
  toggleProjectTaskAction,
} from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProjectDetail } from "@/lib/projects";

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const project = await getProjectDetail(db, { userId, projectId: id });
  if (!project) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/projects" className="text-sm text-zinc-600 underline">
        ← Projects
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">{project.endGoal}</p>
        {project.dueDate && (
          <p className="mt-1 text-sm text-zinc-500">
            Due {project.dueDate.toLocaleDateString()}
          </p>
        )}
        <p className="mt-1 text-sm font-medium">{project.status}</p>
      </div>

      <div className="flex gap-2">
        {project.status === "ACTIVE" && (
          <form action={pauseProjectAction.bind(null, project.id)}>
            <Button type="submit" variant="outline">
              Pause
            </Button>
          </form>
        )}
        {project.status === "PAUSED" && (
          <form action={resumeProjectAction.bind(null, project.id)}>
            <Button type="submit" variant="outline">
              Resume
            </Button>
          </form>
        )}
        {project.status !== "COMPLETED" && (
          <form action={completeProjectAction.bind(null, project.id)}>
            <Button type="submit">Mark complete</Button>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium">Tasks</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {project.tasks.length === 0 && (
            <p className="text-sm text-zinc-600">No tasks yet.</p>
          )}
          {project.tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2">
              <form action={toggleProjectTaskAction.bind(null, task.id, project.id)}>
                <button
                  type="submit"
                  aria-label={task.done ? "Mark not done" : "Mark done"}
                  className={`h-5 w-5 rounded border ${
                    task.done ? "border-zinc-800 bg-zinc-800" : "border-zinc-400 bg-white"
                  }`}
                />
              </form>
              <span className={task.done ? "text-zinc-500 line-through" : ""}>
                {task.text}
              </span>
            </li>
          ))}
        </ul>

        <form
          action={addProjectTaskAction.bind(null, project.id)}
          className="mt-3 flex gap-2"
        >
          <Input name="text" placeholder="Add a task" required />
          <Button type="submit">Add</Button>
        </form>
      </div>
    </div>
  );
}
