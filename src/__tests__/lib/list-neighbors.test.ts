import { describe, expect, it } from "vitest";
import { findListNeighbors } from "@/lib/list-neighbors";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("findListNeighbors", () => {
  it("returns the items just before and after the current one", () => {
    expect(findListNeighbors(items, "b")).toEqual({ previous: { id: "a" }, next: { id: "c" } });
  });

  it("has no previous item at the start of the list", () => {
    expect(findListNeighbors(items, "a")).toEqual({ previous: undefined, next: { id: "b" } });
  });

  it("has no next item at the end of the list", () => {
    expect(findListNeighbors(items, "c")).toEqual({ previous: { id: "b" }, next: undefined });
  });

  it("has no neighbours when the current item isn't in the list", () => {
    expect(findListNeighbors(items, "missing")).toEqual({ previous: undefined, next: undefined });
  });

  it("has no neighbours in a list of one", () => {
    expect(findListNeighbors([{ id: "a" }], "a")).toEqual({ previous: undefined, next: undefined });
  });
});
