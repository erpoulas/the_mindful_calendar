import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationSearch } from "@/app/dashboard/overlays/location-search";

const reservoir = {
  label: "Boulder Reservoir, Boulder, CO, USA",
  name: "Boulder Reservoir",
  address: "Boulder, CO, USA",
};

function answerWith(suggestions: unknown[], status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ suggestions }), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LocationSearch", () => {
  it("suggests places as you type and fills in the picked place's full text", async () => {
    const fetchMock = answerWith([reservoir]);
    render(<LocationSearch id="location" name="location" suggestPlaces />);

    await userEvent.type(screen.getByRole("combobox"), "boulder res");
    await userEvent.click(await screen.findByRole("option", { name: /boulder reservoir/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/place-suggestions?q=boulder+res");
    expect(screen.getByRole("combobox")).toHaveValue(reservoir.label);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("keeps whatever you typed when you don't pick a suggestion", async () => {
    answerWith([reservoir]);
    render(<LocationSearch id="location" name="location" defaultValue="Home" suggestPlaces />);

    await userEvent.type(screen.getByRole("combobox"), " office");

    expect(screen.getByRole("combobox")).toHaveValue("Home office");
  });

  it("is a plain text box with no searching when place search isn't set up", async () => {
    const fetchMock = answerWith([reservoir]);
    render(<LocationSearch id="location" name="location" suggestPlaces={false} />);

    await userEvent.type(screen.getByRole("textbox"), "Riverside trail");

    expect(screen.getByRole("textbox")).toHaveValue("Riverside trail");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows no suggestions when the search fails", async () => {
    answerWith([], 502);
    render(<LocationSearch id="location" name="location" suggestPlaces />);

    await userEvent.type(screen.getByRole("combobox"), "boulder");

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});
