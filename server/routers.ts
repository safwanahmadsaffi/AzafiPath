import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const ageGroups = ["Under 18", "18", "18–25", "25+"] as const;
const goals = ["Job", "Entrepreneur", "FAANG", "Researcher", "Abroad/Study"] as const;
const roadmapInput = z.object({ ageGroup: z.enum(ageGroups), goal: z.enum(goals) });
const roadmapStep = z.object({
  year: z.string(),
  title: z.string(),
  description: z.string(),
  signal: z.string(),
});
const roadmapStepsSchema = {
  type: "array",
  minItems: 5,
  maxItems: 5,
  items: {
    type: "object",
    properties: {
      year: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      signal: { type: "string" },
    },
    required: ["year", "title", "description", "signal"],
    additionalProperties: false,
  },
};

const fallbackRoadmap = (goal: string) => [
  { year: "Now → 90 days", title: "Build your proof of work", description: `Choose one ${goal} skill, create a small public project, and ask for three feedback conversations.`, signal: "Skill capital" },
  { year: "Year 1–2", title: "Enter the first income loop", description: "Target internships, apprenticeships, or first customers while protecting an emergency buffer.", signal: "First income" },
  { year: "Year 3–5", title: "Compound credibility", description: "Ship measurable outcomes, publish your learning, and negotiate around evidence rather than titles.", signal: "Career lift" },
  { year: "Year 6–10", title: "Build optionality", description: "Grow earning power, diversify carefully, and fund the education and health systems that keep you resilient.", signal: "Optionality" },
  { year: "Year 11–20", title: "Design work on your terms", description: "Turn expertise, relationships, and assets into a life that creates opportunities for others in Pakistan.", signal: "Life equity" },
];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  roadmap: router({
    generate: publicProcedure.input(roadmapInput).mutation(async ({ input }) => {
      const fallback = fallbackRoadmap(input.goal);
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are AzadiPath, a careful career and life-planning assistant for young Pakistanis. Return practical, age-aware milestones. Never promise investment returns or guaranteed jobs. Output only JSON." },
            { role: "user", content: `Create a five-step 20-year roadmap for a user in the ${input.ageGroup} age group pursuing ${input.goal}. Include now-to-90-days, years 1-2, 3-5, 6-10, and 11-20. Each step needs year, title, description, and signal. Keep the advice locally grounded, health-aware, and financially cautious.` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "azadipath_roadmap",
              strict: true,
              schema: {
                type: "object",
                properties: { steps: roadmapStepsSchema },
                required: ["steps"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === "string" ? raw : "";
        const parsed = JSON.parse(content) as { steps?: unknown };
        const steps = z.array(roadmapStep).safeParse(parsed.steps);
        if (steps.success && steps.data.length === 5) return { steps: steps.data, source: "ai" as const };
      } catch (error) {
        console.warn("[AzadiPath] AI roadmap fallback:", error instanceof Error ? error.message : error);
      }
      return { steps: fallback, source: "fallback" as const };
    }),
  }),
});

export type AppRouter = typeof appRouter;
