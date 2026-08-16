import type { DbClient } from "./db";

export async function createProject(
  client: DbClient,
  data: {
    userId: string;
    title: string;
    endGoal: string;
    intentionIds: string[];
    dueDate?: Date;
    starterTasks?: string[];
  },
) {
  if (data.intentionIds.length === 0) {
    throw new Error("A project must serve at least one intention");
  }

  return client.project.create({
    data: {
      userId: data.userId,
      title: data.title,
      endGoal: data.endGoal,
      dueDate: data.dueDate,
      intentions: {
        create: data.intentionIds.map((intentionId) => ({ intentionId })),
      },
      tasks: data.starterTasks
        ? { create: data.starterTasks.map((text, order) => ({ text, order })) }
        : undefined,
    },
    include: { intentions: true, tasks: true },
  });
}

export async function listProjects(client: DbClient, userId: string) {
  return client.project.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}
