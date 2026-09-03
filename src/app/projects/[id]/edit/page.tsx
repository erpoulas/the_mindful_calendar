import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProjectAction } from "@/app/actions/projects";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { listIntentions } from "@/lib/intentions";
import { getProjectDetail } from "@/lib/projects";
import { ProjectForm } from "../../project-form";

export default async function EditProjectPage({
  params,
}: PageProps<"/projects/[id]/edit">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [project, intentions] = await Promise.all([
    getProjectDetail(db, { userId, projectId: id }),
    listIntentions(db, userId),
  ]);

  if (!project) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href={`/projects/${id}`} className="text-sm text-zinc-600 underline">
        ← {project.title}
      </Link>

      <ProjectForm
        action={updateProjectAction.bind(null, id)}
        heading="Edit project"
        submitLabel="Save"
        pendingLabel="Saving..."
        intentions={intentions}
        initialValues={{
          title: project.title,
          endGoal: project.endGoal,
          dueDate: project.dueDate,
          intentionIds: project.intentions.map((pi) => pi.intentionId),
        }}
      />
    </div>
  );
}
