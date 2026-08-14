import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { invokeLLM } = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM }));

import { appRouter } from "./routers";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const sampleSteps = Array.from({ length: 5 }, (_, index) => ({
  year: `Year ${index + 1}`,
  title: `Milestone ${index + 1}`,
  description: "A practical, health-aware step for the selected path.",
  signal: "Progress",
}));

describe("roadmap.generate", () => {
  beforeEach(() => invokeLLM.mockReset());

  it("accepts a valid structured AI response", async () => {
    invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ steps: sampleSteps }) } }] });
    const result = await appRouter.createCaller(createContext()).roadmap.generate({ ageGroup: "18", goal: "FAANG" });
    expect(result.source).toBe("ai");
    expect(result.steps).toEqual(sampleSteps);
  });

  it("falls back to a useful five-step plan when the AI response is unusable", async () => {
    invokeLLM.mockResolvedValue({ choices: [] });
    const result = await appRouter.createCaller(createContext()).roadmap.generate({ ageGroup: "18–25", goal: "Entrepreneur" });
    expect(result.source).toBe("fallback");
    expect(result.steps).toHaveLength(5);
    expect(result.steps[0]?.description).toContain("Entrepreneur");
  });

  it("rejects unsupported onboarding values", async () => {
    invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ steps: sampleSteps }) } }] });
    await expect(appRouter.createCaller(createContext()).roadmap.generate({ ageGroup: "17" as never, goal: "FAANG" })).rejects.toThrow();
    expect(invokeLLM).not.toHaveBeenCalled();
  });
});
