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

export async function getProjectDetail(
  client: DbClient,
  params: { userId: string; projectId: string },
) {
  return client.project.findFirst({
    where: { id: params.projectId, userId: params.userId },
    include: {
      intentions: true,
      tasks: { orderBy: { order: "asc" } },
    },
  });
}

export async function updateProject(
  client: DbClient,
  params: {
    userId: string;
    projectId: string;
    title: string;
    endGoal: string;
    intentionIds: string[];
    dueDate?: Date;
  },
) {
  if (params.intentionIds.length === 0) {
    throw new Error("A project must serve at least one intention");
  }

  const project = await client.project.findFirst({
    where: { id: params.projectId, userId: params.userId },
  });
  if (!project) return null;

  return client.project.update({
    where: { id: project.id },
    data: {
      title: params.title,
      endGoal: params.endGoal,
      dueDate: params.dueDate,
      intentions: {
        deleteMany: {},
        create: params.intentionIds.map((intentionId) => ({ intentionId })),
      },
    },
    include: { intentions: true, tasks: { orderBy: { order: "asc" } } },
  });
}

export async function deleteProject(
  client: DbClient,
  params: { userId: string; projectId: string },
) {
  const project = await client.project.findFirst({
    where: { id: params.projectId, userId: params.userId },
  });
  if (!project) return null;

  await client.project.delete({ where: { id: project.id } });
  return project;
}

export async function addProjectTask(
  client: DbClient,
  params: { userId: string; projectId: string; text: string },
) {
  const project = await client.project.findFirst({
    where: { id: params.projectId, userId: params.userId },
  });
  if (!project) return null;

  const lastTask = await client.projectTask.findFirst({
    where: { projectId: params.projectId },
    orderBy: { order: "desc" },
  });

  return client.projectTask.create({
    data: {
      projectId: params.projectId,
      text: params.text,
      order: (lastTask?.order ?? -1) + 1,
    },
  });
}

export async function pauseProject(
  client: DbClient,
  params: { userId: string; projectId: string },
) {
  const project = await client.project.findFirst({
    where: { id: params.projectId, userId: params.userId },
  });
  if (!project) return null;

  return client.project.update({
    where: { id: project.id },
    data: { status: "PAUSED" },
  });
}

export async function resumeProject(
  client: DbClient,
  params: { userId: string; projectId: string },
) {
  const project = await client.project.findFirst({
    where: { id: params.projectId, userId: params.userId },
  });
  if (!project) return null;

  return client.project.update({
    where: { id: project.id },
    data: { status: "ACTIVE" },
  });
}

export async function completeProject(
  client: DbClient,
  params: { userId: string; projectId: string },
) {
  const project = await client.project.findFirst({
    where: { id: params.projectId, userId: params.userId },
  });
  if (!project) return null;

  return client.project.update({
    where: { id: project.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
}

export async function toggleProjectTask(
  client: DbClient,
  params: { userId: string; taskId: string },
) {
  const task = await client.projectTask.findFirst({
    where: { id: params.taskId, project: { userId: params.userId } },
  });
  if (!task) return null;

  return client.projectTask.update({
    where: { id: task.id },
    data: { done: !task.done },
  });
}
