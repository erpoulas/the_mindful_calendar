import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import { createIntention } from "./intentions";
import {
  addProjectTask,
  completeProject,
  createProject,
  getProjectDetail,
  listProjects,
  pauseProject,
  resumeProject,
  toggleProjectTask,
} from "./projects";

describe("createProject", () => {
  it("creates a project with the required fields", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });

      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the Cedar Falls 5k on Oct 12",
        intentionIds: [intention.id],
      });

      expect(project.title).toBe("Train for a 5k");
      expect(project.endGoal).toBe("Run the Cedar Falls 5k on Oct 12");
      expect(project.status).toBe("ACTIVE");
      expect(project.dueDate).toBeNull();
      expect(project.intentions.map((pi) => pi.intentionId)).toEqual([intention.id]);
      expect(project.tasks).toEqual([]);
    });
  });

  it("links multiple intentions when more than one is given", async () => {
    await withRollback(async (tx) => {
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const family = await createIntention(tx, { userId: "test-user-1", name: "Family" });

      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Weekly family walk",
        endGoal: "n/a",
        intentionIds: [health.id, family.id],
      });

      expect(project.intentions.map((pi) => pi.intentionId).sort()).toEqual(
        [health.id, family.id].sort(),
      );
    });
  });

  it("creates starter tasks in order when provided", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Creativity" });

      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Learn guitar",
        endGoal: "Play one full song start to finish",
        intentionIds: [intention.id],
        starterTasks: ["Learn G, C, D chords", "Learn 3 songs"],
      });

      expect(project.tasks.map((t) => t.text)).toEqual([
        "Learn G, C, D chords",
        "Learn 3 songs",
      ]);
      expect(project.tasks.every((t) => t.done === false)).toBe(true);
    });
  });

  it("stores an optional due date when provided", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Career" });
      const dueDate = new Date("2026-09-30T00:00:00Z");

      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Job search",
        endGoal: "Accept a job offer",
        intentionIds: [intention.id],
        dueDate,
      });

      expect(project.dueDate).toEqual(dueDate);
    });
  });

  it("rejects creating a project with no intentions", async () => {
    await withRollback(async (tx) => {
      await expect(
        createProject(tx, {
          userId: "test-user-1",
          title: "No intention project",
          endGoal: "n/a",
          intentionIds: [],
        }),
      ).rejects.toThrow();
    });
  });
});

describe("listProjects", () => {
  it("returns an empty list for a user with no projects", async () => {
    await withRollback(async (tx) => {
      const result = await listProjects(tx, "test-user-1");
      expect(result).toEqual([]);
    });
  });

  it("returns all of the given user's projects", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the race",
        intentionIds: [intention.id],
      });
      await createProject(tx, {
        userId: "test-user-1",
        title: "Learn guitar",
        endGoal: "Play a song",
        intentionIds: [intention.id],
      });

      const result = await listProjects(tx, "test-user-1");

      expect(result.map((p) => p.title).sort()).toEqual(["Learn guitar", "Train for a 5k"]);
    });
  });

  it("never returns another user's projects", async () => {
    await withRollback(async (tx) => {
      const mine = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const theirs = await createIntention(tx, { userId: "test-user-2", name: "Health" });
      await createProject(tx, {
        userId: "test-user-1",
        title: "Mine",
        endGoal: "n/a",
        intentionIds: [mine.id],
      });
      await createProject(tx, {
        userId: "test-user-2",
        title: "Someone else's",
        endGoal: "n/a",
        intentionIds: [theirs.id],
      });

      const result = await listProjects(tx, "test-user-1");

      expect(result.map((p) => p.title)).toEqual(["Mine"]);
    });
  });
});

describe("getProjectDetail", () => {
  it("returns null when the project doesn't exist", async () => {
    await withRollback(async (tx) => {
      const result = await getProjectDetail(tx, {
        userId: "test-user-1",
        projectId: "does-not-exist",
      });
      expect(result).toBeNull();
    });
  });

  it("returns null when the project belongs to another user", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-2", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-2",
        title: "Someone else's",
        endGoal: "n/a",
        intentionIds: [intention.id],
      });

      const result = await getProjectDetail(tx, {
        userId: "test-user-1",
        projectId: project.id,
      });

      expect(result).toBeNull();
    });
  });

  it("returns the project with its linked intentions", async () => {
    await withRollback(async (tx) => {
      const health = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const family = await createIntention(tx, { userId: "test-user-1", name: "Family" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Weekly family walk",
        endGoal: "n/a",
        intentionIds: [health.id, family.id],
      });

      const result = await getProjectDetail(tx, {
        userId: "test-user-1",
        projectId: project.id,
      });

      expect(result?.title).toBe("Weekly family walk");
      expect(result?.intentions.map((pi) => pi.intentionId).sort()).toEqual(
        [health.id, family.id].sort(),
      );
    });
  });

  it("returns tasks ordered by their order field", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Creativity" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Learn guitar",
        endGoal: "Play one full song start to finish",
        intentionIds: [intention.id],
        starterTasks: ["Learn G, C, D chords", "Learn 3 songs"],
      });

      const result = await getProjectDetail(tx, {
        userId: "test-user-1",
        projectId: project.id,
      });

      expect(result?.tasks.map((t) => t.text)).toEqual([
        "Learn G, C, D chords",
        "Learn 3 songs",
      ]);
    });
  });
});

describe("addProjectTask", () => {
  it("adds a task to the project", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the race",
        intentionIds: [intention.id],
      });

      const task = await addProjectTask(tx, {
        userId: "test-user-1",
        projectId: project.id,
        text: "Buy running shoes",
      });

      expect(task?.text).toBe("Buy running shoes");
      expect(task?.done).toBe(false);
    });
  });

  it("appends after existing tasks", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Creativity" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Learn guitar",
        endGoal: "Play a song",
        intentionIds: [intention.id],
        starterTasks: ["Learn G, C, D chords", "Learn 3 songs"],
      });

      await addProjectTask(tx, {
        userId: "test-user-1",
        projectId: project.id,
        text: "Play for a friend",
      });

      const detail = await getProjectDetail(tx, { userId: "test-user-1", projectId: project.id });
      expect(detail?.tasks.map((t) => t.text)).toEqual([
        "Learn G, C, D chords",
        "Learn 3 songs",
        "Play for a friend",
      ]);
    });
  });

  it("returns null when the project doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-2", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-2",
        title: "Someone else's",
        endGoal: "n/a",
        intentionIds: [intention.id],
      });

      const task = await addProjectTask(tx, {
        userId: "test-user-1",
        projectId: project.id,
        text: "Sneaky task",
      });

      expect(task).toBeNull();
    });
  });
});

describe("toggleProjectTask", () => {
  it("marks a not-done task as done", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the race",
        intentionIds: [intention.id],
        starterTasks: ["Buy running shoes"],
      });
      const [task] = project.tasks;

      const updated = await toggleProjectTask(tx, { userId: "test-user-1", taskId: task.id });

      expect(updated?.done).toBe(true);
    });
  });

  it("marks a done task as not-done (reversible)", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the race",
        intentionIds: [intention.id],
        starterTasks: ["Buy running shoes"],
      });
      const [task] = project.tasks;

      await toggleProjectTask(tx, { userId: "test-user-1", taskId: task.id });
      const revertedBack = await toggleProjectTask(tx, {
        userId: "test-user-1",
        taskId: task.id,
      });

      expect(revertedBack?.done).toBe(false);
    });
  });

  it("returns null when the task's project doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-2", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-2",
        title: "Someone else's",
        endGoal: "n/a",
        intentionIds: [intention.id],
        starterTasks: ["Sneaky task"],
      });
      const [task] = project.tasks;

      const result = await toggleProjectTask(tx, { userId: "test-user-1", taskId: task.id });

      expect(result).toBeNull();
    });
  });
});

describe("pauseProject", () => {
  it("sets an active project's status to PAUSED", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the race",
        intentionIds: [intention.id],
      });

      const paused = await pauseProject(tx, { userId: "test-user-1", projectId: project.id });

      expect(paused?.status).toBe("PAUSED");
    });
  });

  it("returns null when the project doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-2", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-2",
        title: "Someone else's",
        endGoal: "n/a",
        intentionIds: [intention.id],
      });

      const result = await pauseProject(tx, { userId: "test-user-1", projectId: project.id });

      expect(result).toBeNull();
    });
  });
});

describe("resumeProject", () => {
  it("sets a paused project's status back to ACTIVE", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the race",
        intentionIds: [intention.id],
      });
      await pauseProject(tx, { userId: "test-user-1", projectId: project.id });

      const resumed = await resumeProject(tx, { userId: "test-user-1", projectId: project.id });

      expect(resumed?.status).toBe("ACTIVE");
    });
  });

  it("returns null when the project doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-2", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-2",
        title: "Someone else's",
        endGoal: "n/a",
        intentionIds: [intention.id],
      });

      const result = await resumeProject(tx, { userId: "test-user-1", projectId: project.id });

      expect(result).toBeNull();
    });
  });
});

describe("completeProject", () => {
  it("marks a project COMPLETED and stamps completedAt", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the race",
        intentionIds: [intention.id],
      });

      const completed = await completeProject(tx, {
        userId: "test-user-1",
        projectId: project.id,
      });

      expect(completed?.status).toBe("COMPLETED");
      expect(completed?.completedAt).not.toBeNull();
    });
  });

  it("can complete a paused project too (independent of pause/resume)", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-1", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-1",
        title: "Train for a 5k",
        endGoal: "Run the race",
        intentionIds: [intention.id],
      });
      await pauseProject(tx, { userId: "test-user-1", projectId: project.id });

      const completed = await completeProject(tx, {
        userId: "test-user-1",
        projectId: project.id,
      });

      expect(completed?.status).toBe("COMPLETED");
    });
  });

  it("returns null when the project doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const intention = await createIntention(tx, { userId: "test-user-2", name: "Health" });
      const project = await createProject(tx, {
        userId: "test-user-2",
        title: "Someone else's",
        endGoal: "n/a",
        intentionIds: [intention.id],
      });

      const result = await completeProject(tx, { userId: "test-user-1", projectId: project.id });

      expect(result).toBeNull();
    });
  });
});
