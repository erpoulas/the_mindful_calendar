import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import { createIntention } from "./intentions";
import { createProject, getProjectDetail, listProjects } from "./projects";

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
