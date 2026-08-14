import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, BadgeIndianRupee, BarChart3, BrainCircuit, Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, Coins, HeartPulse, LineChart, LockKeyhole, Plus, RefreshCw, Route, ShieldCheck, Sparkles, Target, TrendingUp, Wallet, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { monthlyFutureValue, requiredMonthly } from "@shared/finance";
import { calculateRetirement } from "@shared/retirement";
import { cycleRoomIndex, selectRoomIndex, swipeDirection } from "@shared/roomCarousel";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const GOALS = ["Job", "Entrepreneur", "FAANG", "Researcher", "Abroad/Study"] as const;
type Goal = (typeof GOALS)[number];
type AgeGroup = "Under 18" | "18" | "18–25" | "25+";
type Profile = { ageGroup: AgeGroup; goal: Goal };
type Leak = { id: number; label: string; amount: number; healthImpact: number; date: string };

type RoadmapStep = { year: string; title: string; description: string; signal: string; done?: boolean };

const AGE_TO_NUMBER: Record<AgeGroup, number> = { "Under 18": 16, "18": 18, "18–25": 22, "25+": 28 };
const initialProfile: Profile = { ageGroup: "18", goal: "FAANG" };

const roadmapByGoal: Record<Goal, RoadmapStep[]> = {
  Job: [
    { year: "Now → 90 days", title: "Build your proof of work", description: "Choose one Pakistan-relevant skill, complete two portfolio projects, and ask for three feedback conversations.", signal: "Skill capital" },
    { year: "Year 1–2", title: "Enter the first income loop", description: "Target internships, apprenticeships, and local roles while directing a fixed slice of income to your emergency buffer.", signal: "First income" },
    { year: "Year 3–5", title: "Compound credibility", description: "Move from tasks to ownership: lead a project, publish results, and negotiate around measurable outcomes.", signal: "Career lift" },
    { year: "Year 6–10", title: "Own a niche", description: "Build a reputation that travels across cities and borders, then turn surplus cash flow into diversified assets.", signal: "Optionality" },
    { year: "Year 11–20", title: "Design work on your terms", description: "Shift from salary-only thinking to a portfolio of work, investments, and a resilient health routine.", signal: "Life equity" },
  ],
  Entrepreneur: [
    { year: "Now → 90 days", title: "Find a painful local problem", description: "Interview ten people in your city, define one wedge, and launch a manual version before building the full product.", signal: "Customer truth" },
    { year: "Year 1–2", title: "Prove repeatable demand", description: "Track revenue, retention, and delivery time weekly. Keep personal burn low while you find product-market fit.", signal: "Traction" },
    { year: "Year 3–5", title: "Build the operating system", description: "Document sales, delivery, and hiring. Reinvest in distribution before adding complexity.", signal: "Leverage" },
    { year: "Year 6–10", title: "Create multiple income engines", description: "Protect the core business while building a diversified personal reserve and an education budget.", signal: "Resilience" },
    { year: "Year 11–20", title: "Become an ecosystem builder", description: "Mentor, invest responsibly, and create opportunities that keep value circulating in Pakistan.", signal: "National lift" },
  ],
  FAANG: [
    { year: "Now → 90 days", title: "Master the fundamentals", description: "Build a weekly cadence for DSA, communication, and one product project that makes your thinking visible.", signal: "Signal stack" },
    { year: "Year 1–2", title: "Earn strong local reps", description: "Land an internship or junior role, ship production work, and collect proof: metrics, pull requests, and references.", signal: "Real systems" },
    { year: "Year 3–5", title: "Go global deliberately", description: "Prepare for scholarships, remote roles, or a recognized masters while keeping a Pakistan-based financial base.", signal: "Global bridge" },
    { year: "Year 6–10", title: "Interview at the frontier", description: "Pair systems design with a deep specialty. Apply through referrals and evidence, not mass applications.", signal: "Career velocity" },
    { year: "Year 11–20", title: "Turn success into agency", description: "Invest in health, assets, and ventures so your expertise can fund the next generation of builders.", signal: "Generational lift" },
  ],
  Researcher: [
    { year: "Now → 90 days", title: "Choose a question worth a decade", description: "Read deeply, find a mentor, and publish a small reproducible experiment in your field.", signal: "Curiosity" },
    { year: "Year 1–2", title: "Build a research record", description: "Join a lab or research group, learn rigorous methods, and apply for scholarships with a focused narrative.", signal: "Evidence" },
    { year: "Year 3–5", title: "Earn access to better questions", description: "Use fellowships, a masters, or a PhD path to work on problems that matter locally and globally.", signal: "Depth" },
    { year: "Year 6–10", title: "Translate insight into impact", description: "Turn research into tools, policy, or ventures and protect time for health and financial autonomy.", signal: "Transfer" },
    { year: "Year 11–20", title: "Build a knowledge institution", description: "Mentor talent, create open resources, and invest in the infrastructure Pakistan needs to learn faster.", signal: "Legacy" },
  ],
  "Abroad/Study": [
    { year: "Now → 90 days", title: "Build the application base", description: "Map prerequisites, language scores, references, and a story that connects your ambition to a real problem.", signal: "Readiness" },
    { year: "Year 1–2", title: "Create a funding plan", description: "Compare scholarships, assistantships, and low-cost routes. Keep a separate reserve for applications and relocation.", signal: "Mobility" },
    { year: "Year 3–5", title: "Study with a return thesis", description: "Choose a recognized program where skills, network, and lived experience can compound beyond the degree.", signal: "Education ROI" },
    { year: "Year 6–10", title: "Build cross-border leverage", description: "Target global employers or clients while keeping a deliberate savings and family-support policy.", signal: "Bridge" },
    { year: "Year 11–20", title: "Bring capability home", description: "Invest knowledge, capital, or a company into the next era of Pakistan from wherever you are.", signal: "Return" },
  ],
};

const money = (value: number, compact = false) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 1 : 0 }).format(Math.max(0, value));
const pct = (value: number) => `${value.toFixed(1)}%`;

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function SectionEyebrow({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${tone === "light" ? "text-[#B7E45C]" : "text-[#0F8A55]"}`}>{children}</p>;
}

function MetricCard({ label, value, detail, icon: Icon, positive = true }: { label: string; value: string; detail: string; icon: React.ComponentType<{ className?: string }>; positive?: boolean }) {
  return (
    <Card className="border-0 bg-white soft-shadow transition-transform duration-200 hover:-translate-y-1">
      <CardContent className="p-5">
        <div className="mb-5 flex items-start justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF4E8] text-[#0F8A55]"><Icon className="h-4 w-4" /></div><span className={`font-mono text-[10px] font-semibold ${positive ? "text-[#0F8A55]" : "text-[#B86B17]"}`}>{positive ? "on track" : "watch"}</span></div>
        <p className="text-xs font-medium text-[#557166]">{label}</p>
        <p className="data-number mt-1 text-[clamp(1.35rem,3vw,2rem)] font-bold text-[#123328]">{value}</p>
        <p className="mt-2 text-[11px] leading-4 text-[#557166]">{detail}</p>
      </CardContent>
    </Card>
  );
}

const FEATURE_PREVIEWS = [
  { key: "roadmap", icon: Route, label: "Life Roadmap", eyebrow: "01 · Career intelligence", title: "See the next 20 years as a sequence of moves.", body: "AzadiPath connects your age and ambition to practical milestones, from your next 90 days to the kind of work and optionality you want to build over two decades.", points: ["Milestones based on your chosen path", "Education, earning power, and health in one route", "A resilient fallback plan when priorities change"] },
  { key: "investing", icon: BarChart3, label: "KSE-100 Simulator", eyebrow: "02 · Wealth building", title: "Make small monthly contributions visible.", body: "Explore a planning scenario for regular investing in the KSE-100 index. Adjust your monthly amount and time horizon to understand the role of consistency.", points: ["Default scenario uses ~20% CAGR", "Sliders for monthly contribution and duration", "Clear distinction between contributions and projected value"] },
  { key: "leaks", icon: Wallet, label: "Financial Leaks", eyebrow: "03 · Habit intelligence", title: "Turn one avoided impulse into future capital.", body: "Log junk food, impulse buys, or wasted spending as financial leaks. The dashboard shows how redirecting them can support your savings habit and health goals.", points: ["Quick PKR leak logging", "Savings Redirected updates instantly", "Health-wealth correlation without medical diagnosis"] },
  { key: "retirement", icon: HeartPulse, label: "Health + Retirement", eyebrow: "04 · Long-range alignment", title: "Build a future your body can enjoy.", body: "Set a retirement age and corpus target, then see the monthly contribution needed in this planning simulation. Keep career, health, and financial independence connected.", points: ["Back-calculate a monthly target", "Link career milestones to financial capacity", "Wellness signals are guidance, not medical advice"] },
] as const;
type FeatureKey = (typeof FEATURE_PREVIEWS)[number]["key"];

const ROOM_FEATURES = [
  { id: "roadmap", anchor: "roadmap", number: "01", eyebrow: "Career intelligence", label: "Life Roadmap", title: "Your next move, made visible.", description: "A 20-year route that turns your age and ambition into milestones for skills, education, earning power, and global options.", icon: Route, stat: "20 yrs", statLabel: "mapped forward", steps: ["Choose your direction", "Build proof of work", "Unlock global options"], accent: "#B7E45C" },
  { id: "investments", anchor: "investments", number: "02", eyebrow: "Wealth building", label: "KSE-100 Simulator", title: "Let consistency become a strategy.", description: "Model regular monthly contributions to the KSE-100 index and see how time—not hype—can shape a long-range corpus.", icon: BarChart3, stat: "~20%", statLabel: "CAGR scenario", steps: ["Set a monthly amount", "Choose 10–30 years", "See the runway compound"], accent: "#8CE0B2" },
  { id: "habits", anchor: "habits", number: "03", eyebrow: "Daily leverage", label: "Financial Leaks", title: "Redirect the small leaks.", description: "Capture impulse food, purchases, and wasted spending as financial leaks, then turn awareness into a repeatable savings contribution.", icon: Wallet, stat: "PKR", statLabel: "saved per habit", steps: ["Name the leak", "Log the amount", "Redirect it to your future"], accent: "#F2D17E" },
  { id: "retirement", anchor: "retirement", number: "04", eyebrow: "Health + future", label: "Health + Retirement", title: "Build a future your body can enjoy.", description: "Connect wellness signals, career income, and a retirement corpus so your financial plan serves your whole life.", icon: HeartPulse, stat: "100", statLabel: "risk signal scale", steps: ["Set your retirement age", "Choose a corpus target", "Align income and wellbeing"], accent: "#F0A3A3" },
] as const;

export function FeatureRooms({ onBuildPath, onJump }: { onBuildPath: () => void; onJump: (id: string) => void }) {
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);
  const activeRoom = ROOM_FEATURES[activeRoomIndex];
  const RoomIcon = activeRoom.icon;
  const moveRoom = (direction: number) => setActiveRoomIndex((current) => cycleRoomIndex(current, direction, ROOM_FEATURES.length));
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;
    moveRoom(swipeDirection(pointerStartX.current, event.clientX));
    pointerStartX.current = null;
  };
  const handlePointerCancel = () => { pointerStartX.current = null; };
  return (
    <section id="rooms" aria-label="AzadiPath four feature rooms" className="relative overflow-hidden rounded-[30px] bg-[#063D2A] p-5 text-white soft-shadow-lg sm:p-8 lg:p-10">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#0F8A55]/50 blur-3xl" />
      <div className="absolute bottom-[-7rem] left-1/3 h-64 w-64 rounded-full bg-[#B7E45C]/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><SectionEyebrow tone="light">Pakistan @ 79 · Four rooms</SectionEyebrow><h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-[-0.06em] sm:text-5xl">Move through the rooms. Build the whole life.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Each room holds one part of your future. Slide through them, then enter your personalized Build my path flow.</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => moveRoom(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7E45C]" aria-label="Previous feature room"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => moveRoom(1)} className="grid h-10 w-10 place-items-center rounded-full bg-[#B7E45C] text-[#063D2A] transition-colors hover:bg-[#D4F48C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Next feature room"><ChevronRight className="h-4 w-4" /></button></div></div>
        <div data-testid="room-surface" key={activeRoom.id} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} className="mt-8 grid touch-pan-y cursor-grab select-none animate-in fade-in slide-in-from-right-6 duration-300 gap-4 active:cursor-grabbing lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative overflow-hidden rounded-[24px] p-6 sm:p-8" style={{ backgroundColor: activeRoom.accent, color: "#063D2A" }}><div className="absolute right-[-2rem] top-[-2rem] h-40 w-40 rounded-full border-[22px] border-[#063D2A]/10" /><div className="relative flex min-h-[250px] flex-col justify-between"><div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#063D2A] text-[#B7E45C]"><RoomIcon className="h-5 w-5" /></div><span className="font-mono text-4xl font-bold tracking-[-0.08em] text-[#063D2A]/25">{activeRoom.number}</span></div><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#063D2A]/60">{activeRoom.eyebrow}</p><h3 className="mt-2 max-w-md font-display text-3xl font-bold leading-[1.02] tracking-[-0.06em] sm:text-4xl">{activeRoom.title}</h3><p className="mt-3 max-w-lg text-sm leading-6 text-[#063D2A]/70">{activeRoom.description}</p></div></div></div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-6 sm:p-8"><div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Room output</p><p className="mt-2 text-lg font-bold text-white">{activeRoom.label}</p></div><div className="text-right"><p className="font-display text-3xl font-bold tracking-[-0.06em] text-[#B7E45C]">{activeRoom.stat}</p><p className="text-[10px] text-white/45">{activeRoom.statLabel}</p></div></div><div className="mt-6 space-y-3">{activeRoom.steps.map((step, index) => <div key={step} className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#B7E45C]/35 font-mono text-[10px] text-[#B7E45C]">0{index + 1}</span><span className="text-sm text-white/70">{step}</span><Check className="ml-auto h-3.5 w-3.5 text-[#B7E45C]" /></div>)}</div><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"><Button type="button" onClick={() => onJump(activeRoom.anchor)} className="h-11 rounded-xl bg-white px-5 text-xs font-bold text-[#063D2A] hover:bg-[#EAF4E8]">Open this room <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button><button type="button" onClick={onBuildPath} className="text-left text-xs font-semibold text-[#B7E45C] hover:text-white">Build my path now</button></div></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-2" role="tablist" aria-label="Feature rooms">{ROOM_FEATURES.map((room, index) => <button type="button" key={room.id} onClick={() => setActiveRoomIndex(selectRoomIndex(index, ROOM_FEATURES.length))} role="tab" aria-selected={activeRoomIndex === index} aria-label={`Show ${room.label} room`} className={`h-2 rounded-full transition-all duration-300 ${activeRoomIndex === index ? "w-8 bg-[#B7E45C]" : "w-2 bg-white/25 hover:bg-white/60"}`} />)}</div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Swipe / tap arrows to move</p></div>
      </div>
    </section>
  );
}

function Onboarding({ onComplete }: { onComplete: (profile: Profile) => void }) {
  const [activeFeature, setActiveFeature] = useState<FeatureKey | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("18");
  const [goal, setGoal] = useState<Goal>("FAANG");
  const selectedFeature = FEATURE_PREVIEWS.find((feature) => feature.key === activeFeature);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#063D2A]/80 p-4 backdrop-blur-sm">
      <div className="signal-grid relative w-full max-w-2xl overflow-hidden rounded-[28px] bg-[#F8FBF4] soft-shadow-lg">
        <div className="absolute right-0 top-0 h-44 w-44 translate-x-16 -translate-y-16 rounded-full bg-[#B7E45C]/60 blur-2xl" />
        <div className="relative p-6 sm:p-10">
          <div className="mb-10 flex items-center justify-between"><div><SectionEyebrow>Pakistan @ 79 · Your first signal</SectionEyebrow><h1 className="mt-3 max-w-md font-display text-3xl font-bold leading-[1.05] tracking-[-0.06em] text-[#123328] sm:text-5xl">Start where you are. Build where Pakistan is going.</h1></div><div className="hidden h-12 w-12 place-items-center rounded-2xl bg-[#B7E45C] text-[#063D2A] sm:grid"><Sparkles className="h-5 w-5" /></div></div>
          <p className="max-w-xl text-sm leading-6 text-[#557166]">AzadiPath turns your age, ambition, health, and money habits into one clear starting route. This is a planning simulation—not a promise of returns.</p>
          {selectedFeature ? (
            <div className="mt-6 animate-in fade-in slide-in-from-right-4 duration-300 rounded-[22px] border border-[#BBDCB8] bg-white/80 p-5 sm:p-6" aria-live="polite">
              <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B5D3B] text-[#B7E45C]"><selectedFeature.icon className="h-5 w-5" /></div><div><SectionEyebrow>{selectedFeature.eyebrow}</SectionEyebrow><p className="mt-1 text-sm font-bold text-[#123328]">{selectedFeature.label}</p></div></div><button type="button" onClick={() => setActiveFeature(null)} className="rounded-full border border-[#D5E5D6] px-3 py-1.5 text-[11px] font-semibold text-[#557166] transition-colors hover:border-[#0F8A55] hover:text-[#0F8A55]">All features</button></div>
              <h2 className="mt-6 max-w-lg font-display text-2xl font-bold leading-tight tracking-[-0.05em] text-[#123328] sm:text-3xl">{selectedFeature.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#557166]">{selectedFeature.body}</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">{selectedFeature.points.map((point) => <div key={point} className="rounded-xl bg-[#EAF4E8] px-3 py-2.5 text-[11px] leading-4 text-[#315B49]">{point}</div>)}</div>
              <button type="button" onClick={() => setActiveFeature(null)} className="mt-5 inline-flex items-center text-xs font-bold text-[#0F8A55] hover:text-[#063D2A]">Select your starting age & goal <ArrowRight className="ml-2 h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <div className="mt-6 grid gap-2 sm:grid-cols-2" aria-label="AzadiPath feature overview">
              {FEATURE_PREVIEWS.map(({ key, icon: Icon, label, body }) => (
                <button type="button" key={key} onClick={() => setActiveFeature(key)} className="group flex items-start gap-3 rounded-2xl border border-[#D5E5D6] bg-white/70 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#A8D99F] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F8A55]">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EAF4E8] text-[#0F8A55]"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0"><p className="text-xs font-bold text-[#123328]">{label}</p><p className="mt-1 text-[11px] leading-4 text-[#557166]">{body}</p><span className="mt-2 inline-flex items-center text-[10px] font-bold text-[#0F8A55] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">View preview <ChevronRight className="ml-1 h-3 w-3" /></span></div>
                </button>
              ))}
            </div>
          )}
          <div className="mt-10 space-y-8">
            <fieldset><legend className="mb-3 text-sm font-semibold text-[#123328]">Where are you starting?</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(["Under 18", "18", "18–25", "25+"] as AgeGroup[]).map((item) => <button key={item} onClick={() => setAgeGroup(item)} className={`rounded-2xl px-3 py-4 text-left text-sm font-semibold transition-all ${ageGroup === item ? "bg-[#0B5D3B] text-white shadow-lg" : "bg-[#EAF4E8] text-[#557166] hover:bg-[#DDEBDD]"}`}><span className="block font-mono text-[10px] uppercase tracking-widest opacity-60">Age group</span><span className="mt-2 block">{item}</span></button>)}</div></fieldset>
            <fieldset><legend className="mb-3 text-sm font-semibold text-[#123328]">What future are you building?</legend><div className="grid gap-2 sm:grid-cols-5">{GOALS.map((item) => <button key={item} onClick={() => setGoal(item)} className={`min-h-16 rounded-2xl px-3 py-3 text-left text-xs font-semibold transition-all ${goal === item ? "bg-[#0F8A55] text-white shadow-lg" : "bg-[#EAF4E8] text-[#557166] hover:bg-[#DDEBDD]"}`}>{item}</button>)}</div></fieldset>
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#D5E5D6] pt-6 sm:flex-row sm:items-center"><p className="max-w-sm text-xs leading-5 text-[#557166]">{ageGroup === "Under 18" ? "Under 18? Bring a parent or trusted adult into important financial decisions." : "You can change this path anytime as your life evolves."}</p><Button onClick={() => onComplete({ ageGroup, goal })} className="h-12 w-full rounded-xl bg-[#0B5D3B] px-6 text-sm font-semibold text-white shadow-lg shadow-[#0B5D3B]/15 hover:bg-[#063D2A] sm:w-auto">Build my path <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const leaksQuery = trpc.leaks.list.useQuery(undefined, { enabled: isAuthenticated });
  const saveProfileMutation = trpc.profile.save.useMutation();
  const addLeakMutation = trpc.leaks.add.useMutation({
    onSuccess: () => {
      utils?.leaks?.list?.invalidate?.();
    },
  });
  const utils = (trpc as any).useUtils ? trpc.useUtils() : null;

  const [profile, setProfile] = useState<Profile>(() => readStored("azadipath-profile", initialProfile));

  useEffect(() => {
    if (profileQuery.data) {
      setProfile({ ageGroup: profileQuery.data.ageGroup as AgeGroup, goal: profileQuery.data.goal as Goal });
    }
  }, [profileQuery.data]);

  useEffect(() => {
    if (leaksQuery.data && leaksQuery.data.length > 0) {
      setLeaks(leaksQuery.data.map(l => ({ id: l.id, label: l.label, amount: Number(l.amount), healthImpact: l.healthImpact, date: l.dateLabel })));
    }
  }, [leaksQuery.data]);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("azadipath-onboarded"));
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [duration, setDuration] = useState(20);
  const [retirementAge, setRetirementAge] = useState(55);
  const [currentMonthlyExpense, setCurrentMonthlyExpense] = useState(120000);
  const [inflationRateInput, setInflationRateInput] = useState(8);
  const [swrInput, setSwrInput] = useState(8);
  const [leaks, setLeaks] = useState<Leak[]>(() => readStored("azadipath-leaks", []));
  const [leakLabel, setLeakLabel] = useState("Late-night food delivery");
  const [leakAmount, setLeakAmount] = useState("500");
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>(() => roadmapByGoal[profile.goal]);
  const [generating, setGenerating] = useState(false);
  const roadmapMutation = trpc.roadmap.generate.useMutation({
    onSuccess: (result) => {
      setRoadmap(result.steps);
      setGenerating(false);
      toast.success(result.source === "ai" ? "Your AI-generated 20-year roadmap is ready." : "Roadmap refreshed with a resilient fallback.");
    },
    onError: () => {
      setRoadmap(roadmapByGoal[profile.goal]);
      setGenerating(false);
      toast.error("Roadmap service unavailable; your personalized local plan is still ready.");
    },
  });

  const age = AGE_TO_NUMBER[profile.ageGroup];
  const savedMonthly = leaks.reduce((sum, leak) => sum + leak.amount, 0);
  const totalViceSpending = leaks.reduce((sum, leak) => sum + leak.amount, 0);
  const projectedNetWorth = monthlyFutureValue(monthlyInvestment + savedMonthly, duration);
  const baseNetWorth = monthlyFutureValue(monthlyInvestment, duration);
  const healthRisk = Math.min(99, Math.max(12, Math.round(24 + leaks.reduce((sum, leak) => sum + leak.healthImpact, 0) * 2.4 + leaks.length * 2)));
  const retirementCalc = useMemo(() => {
    return calculateRetirement({
      currentAge: age,
      targetRetirementAge: retirementAge,
      monthlyExpensePKR: currentMonthlyExpense,
      inflationRate: inflationRateInput / 100,
      preRetirementReturn: 0.18,
      postRetirementReturn: 0.14,
      safeWithdrawalRate: swrInput / 100,
    });
  }, [age, retirementAge, currentMonthlyExpense, inflationRateInput, swrInput]);
  const yearsToRetirement = retirementCalc.yearsToRetirement;
  const monthlyRetirementNeed = retirementCalc.requiredMonthlySavings;
  const targetCorpus = retirementCalc.requiredCorpus;
  const chartData = useMemo(() => Array.from({ length: duration + 1 }, (_, year) => ({ year: `Y${year}`, invested: Math.round((monthlyInvestment + savedMonthly) * 12 * year), projected: Math.round(monthlyFutureValue(monthlyInvestment + savedMonthly, year)) })), [duration, monthlyInvestment, savedMonthly]);
  const currentRoadmap = roadmap.length ? roadmap : roadmapByGoal[profile.goal];

  useEffect(() => { localStorage.setItem("azadipath-profile", JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem("azadipath-leaks", JSON.stringify(leaks)); }, [leaks]);
  useEffect(() => { setRoadmap(roadmapByGoal[profile.goal]); }, [profile.goal]);

  const completeOnboarding = (nextProfile: Profile) => {
    setProfile(nextProfile);
    setRoadmap(roadmapByGoal[nextProfile.goal]);
    setShowOnboarding(false);
    localStorage.setItem("azadipath-onboarded", "true");
    if (isAuthenticated) {
      saveProfileMutation.mutate({ ageGroup: nextProfile.ageGroup, goal: nextProfile.goal });
    }
    toast.success(`Your ${nextProfile.goal} path is ready.`);
  };

  const generateRoadmap = () => {
    setGenerating(true);
    roadmapMutation.mutate({ ageGroup: profile.ageGroup, goal: profile.goal });
  };

  const addLeak = () => {
    const amount = Number(leakAmount);
    if (!leakLabel.trim() || !amount || amount < 1) { toast.error("Add a name and a positive PKR amount."); return; }
    const healthImpact = Math.min(10, Math.max(1, Math.round(amount / 250)));
    const dateLabel = new Date().toLocaleDateString("en-PK", { day: "numeric", month: "short" });
    if (isAuthenticated) {
      addLeakMutation.mutate({ label: leakLabel.trim(), amount, healthImpact, dateLabel });
    }
    setLeaks((current) => [{ id: Date.now(), label: leakLabel.trim(), amount, healthImpact, date: dateLabel }, ...current]);
    setLeakAmount("500");
    toast.success(`${money(amount)} redirected from a financial leak.`);
  };

  const removeLeak = (id: number) => setLeaks((current) => current.filter((leak) => leak.id !== id));

  const jump = (id: string) => { window.history.replaceState(null, "", `/#${id}`); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <div className="min-h-screen bg-[#F8FBF4] text-[#123328]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#B7E45C] focus:px-4 focus:py-2 focus:text-[#063D2A]">Skip to content</a>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      <div className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-8 lg:px-12">
        <nav aria-label="AzadiPath features" className="sticky top-0 z-30 -mx-4 border-b border-[#D5E5D6]/80 bg-[#F8FBF4]/95 px-4 py-3 backdrop-blur-md sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => jump("overview")} className="flex shrink-0 items-center gap-2 text-left"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0B5D3B] font-display text-sm font-bold text-[#B7E45C]">A</span><span className="hidden font-display text-sm font-bold tracking-[-0.04em] text-[#123328] sm:inline">AzadiPath</span></button>
            <div className="h-5 w-px shrink-0 bg-[#D5E5D6]" />
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[{ id: "rooms", label: "Rooms" }, { id: "overview", label: "Overview" }, { id: "roadmap", label: "Roadmap" }, { id: "investments", label: "Invest" }, { id: "habits", label: "Habits" }, { id: "retirement", label: "Retirement" }].map((item) => <button type="button" key={item.id} onClick={() => jump(item.id)} className="shrink-0 rounded-full px-3 py-2 text-[11px] font-semibold text-[#557166] transition-colors hover:bg-[#EAF4E8] hover:text-[#0B5D3B]">{item.label}</button>)}
            </div>
            <Button type="button" onClick={() => setShowOnboarding(true)} className="h-9 shrink-0 rounded-xl bg-[#0B5D3B] px-3 text-[11px] font-bold text-white hover:bg-[#063D2A] sm:px-4">Build path <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
          </div>
        </nav>
        <div className="pt-5 sm:pt-8"><FeatureRooms onBuildPath={() => setShowOnboarding(true)} onJump={jump} /></div>
        <header id="overview" className="relative overflow-hidden border-b border-[#D5E5D6] py-8 sm:py-12">
          <div className="absolute right-[-4rem] top-[-5rem] h-64 w-64 rounded-full bg-[#EAF4E8]" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl"><div className="flex flex-wrap items-center gap-3"><Badge className="rounded-full bg-[#0B5D3B] px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-[#B7E45C] hover:bg-[#0B5D3B]">PAKISTAN @ 79</Badge><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#557166]">{profile.ageGroup} · {profile.goal}</span></div><h1 className="mt-5 max-w-2xl font-display text-[clamp(2.3rem,5.2vw,5rem)] font-bold leading-[0.96] tracking-[-0.08em] text-[#123328]">Your next era starts with one clear path.</h1><p className="mt-5 max-w-xl text-sm leading-6 text-[#557166] sm:text-base">A personal control room for health, career, and wealth—so Pakistani talent can start earlier, move smarter, and build further.</p></div>
            <div className="flex flex-col items-start gap-3 lg:items-end"><div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 soft-shadow"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B7E45C] text-[#063D2A]"><ShieldCheck className="h-4 w-4" /></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#557166]">Path status</p><p className="text-sm font-bold text-[#123328]">Built for your starting point</p></div></div><button onClick={() => setShowOnboarding(true)} className="text-xs font-semibold text-[#0F8A55] hover:text-[#063D2A]">Change age or goal <ChevronRight className="ml-1 inline h-3 w-3" /></button></div>
          </div>
        </header>

        <section className="grid gap-3 py-8 sm:grid-cols-2 xl:grid-cols-4" aria-label="Personal P&L dashboard">
          <MetricCard label="Vice Spending" value={money(totalViceSpending, true)} detail={leaks.length ? `${leaks.length} financial leak${leaks.length === 1 ? "" : "s"} logged this run` : "Log a financial leak to begin"} icon={Wallet} positive={!totalViceSpending} />
          <MetricCard label="Savings Redirected" value={money(savedMonthly, true)} detail="Monthly amount converted into future capital" icon={Coins} />
          <MetricCard label="Projected Net Worth" value={money(projectedNetWorth, true)} detail={`At ${duration} years with ~20% CAGR assumption`} icon={TrendingUp} />
          <MetricCard label="Biological Age Risk Score" value={`${healthRisk}/100`} detail="Wellness signal, not a diagnosis" icon={HeartPulse} positive={healthRisk < 45} />
        </section>

        <section id="roadmap" className="scroll-mt-6 rounded-[26px] bg-[#063D2A] p-5 text-white soft-shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><SectionEyebrow tone="light">01 · Career & skill architecture</SectionEyebrow><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">Your AI-generated 20-year Life Roadmap</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Engineered for a {profile.ageGroup.toLowerCase()} pursuing {profile.goal} in Pakistan’s digital economy. This roadmap balances local university foundations or self-taught mastery, global remote earnings, and foreign masters funding—so skill acquisition compounds without burnout.</p></div><Button onClick={generateRoadmap} disabled={generating} className="h-11 shrink-0 rounded-xl bg-[#B7E45C] px-5 text-sm font-bold text-[#063D2A] hover:bg-[#D4F48C]">{generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{generating ? "Generating…" : "Refresh roadmap"}</Button></div>
          <div className="mt-8 grid gap-3 lg:grid-cols-5">{currentRoadmap.map((step, index) => <div key={step.title} className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition-colors hover:bg-white/[0.1]">{index < currentRoadmap.length - 1 && <div className="absolute -right-3 top-7 z-10 hidden h-px w-6 bg-[#B7E45C]/60 lg:block" />}<div className="flex items-center justify-between"><span className="font-mono text-[10px] font-semibold text-[#B7E45C]">0{index + 1}</span><span className="rounded-full bg-white/10 px-2 py-1 font-mono text-[9px] text-white/55">{step.signal}</span></div><p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{step.year}</p><h3 className="mt-2 text-sm font-bold leading-5 text-white">{step.title}</h3><p className="mt-2 text-xs leading-5 text-white/58">{step.description}</p></div>)}</div>
          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between"><span><span className="text-[#B7E45C]">Signal:</span> your career is a compounding asset. Pair each milestone with one health and one money habit.</span><button onClick={() => jump("investments")} className="font-semibold text-[#B7E45C] hover:text-white">See the money runway <ArrowRight className="ml-1 inline h-3 w-3" /></button></div>
        </section>

        <section id="investments" className="scroll-mt-6 py-10 sm:py-14">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><SectionEyebrow>02 · Wealth & capital runway</SectionEyebrow><h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.06em] text-[#123328]">Make your monthly compounding visible.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#557166]">Simulate regular contributions into Pakistani equities (<strong className="text-[#123328]">KSE-100 index</strong>). Modeled with an illustrative <strong className="text-[#123328]">~20% CAGR</strong> assumption, accounting for dividend reinvestment, inflation drag, and disciplined dollar-cost averaging.</p></div><div className="flex items-center gap-2 rounded-xl bg-[#EAF4E8] px-3 py-2 text-xs font-semibold text-[#0F8A55]"><LineChart className="h-4 w-4" /> Compound, don’t chase</div></div>
          <Card className="overflow-hidden border-0 bg-white soft-shadow"><CardContent className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0"><div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium text-[#557166]">Projected corpus</p><p className="data-number mt-1 text-4xl font-bold text-[#123328]">{money(projectedNetWorth, true)}</p></div><div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#557166]">Increment from leaks</p><p className="data-number mt-1 text-lg font-bold text-[#0F8A55]">+{money(projectedNetWorth - baseNetWorth, true)}</p></div></div><div className="h-[260px] w-full" aria-label={`KSE-100 projection from ${money(monthlyInvestment + savedMonthly)} monthly for ${duration} years`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 4, left: -24, bottom: 0 }}><defs><linearGradient id="projectionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0F8A55" stopOpacity={0.35} /><stop offset="100%" stopColor="#0F8A55" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#EAF4E8" vertical={false} /><XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "#557166", fontSize: 10 }} interval={Math.max(0, Math.floor(duration / 5) - 1)} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#557166", fontSize: 10 }} tickFormatter={(value) => `₨${Math.round(value / 1000000)}m`} /><Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #D5E5D6", boxShadow: "0 12px 32px rgba(10,80,49,.12)", fontSize: 12 }} formatter={(value: number) => [money(value), "Projected"]} /><Area type="monotone" dataKey="projected" stroke="#0B5D3B" strokeWidth={3} fill="url(#projectionFill)" /></AreaChart></ResponsiveContainer></div><div className="mt-4 flex items-center gap-2 text-[11px] text-[#557166]"><CircleHelp className="h-3.5 w-3.5 text-[#0F8A55]" /> In the demo, the green line shows projected value; the principal is not a guarantee.</div></div>
            <div className="space-y-6 rounded-2xl bg-[#EAF4E8] p-5"><div><Label htmlFor="monthly-investment" className="text-xs font-semibold text-[#123328]">Monthly investment</Label><p className="data-number mt-2 text-2xl font-bold text-[#0B5D3B]">{money(monthlyInvestment)}</p><input id="monthly-investment" type="range" min="1000" max="50000" step="500" value={monthlyInvestment} onChange={(event) => setMonthlyInvestment(Number(event.target.value))} className="mt-4 w-full accent-[#0B5D3B]" aria-label="Monthly investment amount" /><div className="mt-1 flex justify-between font-mono text-[9px] text-[#557166]"><span>₨1k</span><span>₨50k</span></div></div><Separator className="bg-[#D5E5D6]" /><div><Label htmlFor="duration" className="text-xs font-semibold text-[#123328]">Investment duration</Label><p className="data-number mt-2 text-2xl font-bold text-[#0B5D3B]">{duration} years</p><input id="duration" type="range" min="10" max="30" step="1" value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="mt-4 w-full accent-[#0B5D3B]" aria-label="Investment duration in years" /><div className="mt-1 flex justify-between font-mono text-[9px] text-[#557166]"><span>10y</span><span>30y</span></div></div><div className="rounded-xl bg-white/70 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#557166]">At this pace</p><p className="mt-1 text-xs leading-5 text-[#123328]">Your future self receives <strong>{money(monthlyInvestment + savedMonthly)}</strong> every month in this scenario.</p></div></div>
          </CardContent></Card>
        </section>

        <section id="habits" className="scroll-mt-6 grid gap-5 lg:grid-cols-[1fr_1.05fr]">
          <Card className="border-0 bg-white soft-shadow"><CardHeader className="p-5 pb-0 sm:p-7 sm:pb-0"><div className="flex items-start justify-between gap-4"><div><SectionEyebrow>03 · Habit & energy leverage</SectionEyebrow><CardTitle className="mt-2 text-2xl tracking-[-0.05em] text-[#123328]">Turn micro-leaks into equity.</CardTitle><p className="mt-2 max-w-md text-sm leading-5 text-[#557166]">Capture daily friction points (impulse spending, delivery charges, or burnout habits). AzadiPath automatically quantifies their long-term drag and redirects capital into your investment queue.</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF4E8] text-[#0F8A55]"><HeartPulse className="h-5 w-5" /></div></div></CardHeader><CardContent className="p-5 sm:p-7"><div className="grid gap-3 sm:grid-cols-[1fr_130px_auto]"><div><Label htmlFor="leak-label" className="mb-2 block text-[11px] font-semibold text-[#557166]">Financial leak</Label><Input id="leak-label" value={leakLabel} onChange={(event) => setLeakLabel(event.target.value)} className="h-11 rounded-xl border-[#D5E5D6] bg-[#F8FBF4] text-sm" placeholder="e.g. impulse delivery" /></div><div><Label htmlFor="leak-amount" className="mb-2 block text-[11px] font-semibold text-[#557166]">PKR amount</Label><Input id="leak-amount" inputMode="numeric" value={leakAmount} onChange={(event) => setLeakAmount(event.target.value.replace(/[^0-9]/g, ""))} className="h-11 rounded-xl border-[#D5E5D6] bg-[#F8FBF4] text-sm" /></div><Button onClick={addLeak} className="mt-auto h-11 rounded-xl bg-[#0B5D3B] text-white hover:bg-[#063D2A] sm:w-11 sm:p-0" aria-label="Log financial leak"><Plus className="h-4 w-4 sm:mr-0" /><span className="sm:hidden">Log leak</span></Button></div><div className="mt-6 rounded-2xl bg-[#063D2A] p-4 text-white"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B7E45C]">Health ↔ wealth loop</p><p className="mt-2 text-sm leading-5 text-white/70">Redirecting {money(savedMonthly)} each month can support your future without pretending a habit score is a medical diagnosis.</p></div><TrendingUp className="h-5 w-5 shrink-0 text-[#B7E45C]" /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#B7E45C] transition-all duration-300" style={{ width: `${Math.min(100, Math.max(8, savedMonthly / 50))}%` }} /></div></div></CardContent></Card>

          <Card className="border-0 bg-[#EAF4E8] soft-shadow"><CardHeader className="p-5 pb-0 sm:p-7 sm:pb-0"><div className="flex items-center justify-between"><div><SectionEyebrow>Leak ledger</SectionEyebrow><CardTitle className="mt-2 text-2xl tracking-[-0.05em] text-[#123328]">Your redirect queue</CardTitle></div><Badge className="rounded-full bg-white px-3 py-1 text-[#0F8A55] hover:bg-white">{leaks.length} logged</Badge></div></CardHeader><CardContent className="p-5 sm:p-7">{leaks.length === 0 ? <div className="grid min-h-[210px] place-items-center rounded-2xl border border-dashed border-[#B8D0BA] bg-white/35 p-6 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#0F8A55]"><Target className="h-5 w-5" /></div><p className="mt-4 text-sm font-semibold text-[#123328]">No financial leaks logged yet.</p><p className="mt-1 max-w-xs text-xs leading-5 text-[#557166]">Start with one honest entry. Awareness is already a return on investment.</p></div></div> : <div className="space-y-2">{leaks.slice(0, 5).map((leak) => <div key={leak.id} className="flex items-center gap-3 rounded-2xl bg-white/75 p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#DFF0DA] text-[#0F8A55]"><BadgeIndianRupee className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#123328]">{leak.label}</p><p className="text-[10px] text-[#557166]">{leak.date} · wellness signal {leak.healthImpact}/10</p></div><p className="data-number text-sm font-bold text-[#0B5D3B]">+{money(leak.amount, true)}</p><button onClick={() => removeLeak(leak.id)} className="grid h-8 w-8 place-items-center rounded-lg text-[#557166] hover:bg-[#EAF4E8] hover:text-[#0B5D3B]" aria-label={`Remove ${leak.label}`}><X className="h-3.5 w-3.5" /></button></div>)}</div>}</CardContent></Card>
        </section>

        <section id="retirement" className="mt-5 scroll-mt-6 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <Card className="border-0 bg-white soft-shadow"><CardHeader className="p-5 pb-0 sm:p-7 sm:pb-0"><div className="flex items-start justify-between gap-4"><div><SectionEyebrow>04 · Future funding</SectionEyebrow><CardTitle className="mt-2 text-2xl tracking-[-0.05em] text-[#123328]">Upgraded Retirement & Goal Planner</CardTitle><p className="mt-2 max-w-lg text-sm leading-5 text-[#557166]">Plan with inflation, safe withdrawal rates, and asset allocation. Back-calculates the exact monthly capital needed to maintain lifestyle.</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF4E8] text-[#0F8A55]"><Target className="h-5 w-5" /></div></div></CardHeader><CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7"><div><Label htmlFor="retirement-age" className="text-xs font-semibold text-[#123328]">Target retirement age</Label><div className="mt-2 flex items-center gap-2"><Input id="retirement-age" type="number" min="35" max="80" value={retirementAge} onChange={(event) => setRetirementAge(Number(event.target.value))} className="h-11 rounded-xl border-[#D5E5D6] bg-[#F8FBF4]" /><span className="text-xs text-[#557166]">years old</span></div></div><div><Label htmlFor="current-monthly-expense" className="text-xs font-semibold text-[#123328]">Current monthly expense</Label><div className="mt-2 flex items-center gap-2"><Input id="current-monthly-expense" type="number" min="30000" step="5000" value={currentMonthlyExpense} onChange={(event) => setCurrentMonthlyExpense(Number(event.target.value))} className="h-11 rounded-xl border-[#D5E5D6] bg-[#F8FBF4]" /><span className="text-xs text-[#557166]">PKR</span></div></div><div><Label htmlFor="inflation-rate" className="text-xs font-semibold text-[#123328]">Assumed inflation rate</Label><div className="mt-2 flex items-center gap-2"><Input id="inflation-rate" type="number" min="3" max="20" step="0.5" value={inflationRateInput} onChange={(event) => setInflationRateInput(Number(event.target.value))} className="h-11 rounded-xl border-[#D5E5D6] bg-[#F8FBF4]" /><span className="text-xs text-[#557166]">%</span></div></div><div><Label htmlFor="swr-rate" className="text-xs font-semibold text-[#123328]">Safe withdrawal rate (SWR)</Label><div className="mt-2 flex items-center gap-2"><Input id="swr-rate" type="number" min="4" max="12" step="0.5" value={swrInput} onChange={(event) => setSwrInput(Number(event.target.value))} className="h-11 rounded-xl border-[#D5E5D6] bg-[#F8FBF4]" /><span className="text-xs text-[#557166]">%</span></div></div><div className="rounded-2xl bg-[#0B5D3B] p-4 text-white sm:col-span-2"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B7E45C]">Required Monthly Savings</p><p className="data-number mt-1 text-3xl font-bold">{money(monthlyRetirementNeed)}</p></div><div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">Required Corpus</p><p className="data-number mt-1 text-xl font-bold">{money(targetCorpus, true)}</p></div></div><div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-white/80"><span>Asset Mix: <strong>{retirementCalc.suggestedEquityAllocation}% Equity (KSE-100)</strong> / <strong>{retirementCalc.suggestedFixedIncomeAllocation}% Fixed Income</strong></span><span>Horizon: {yearsToRetirement} yrs</span></div></div></CardContent></Card>

          <Card className="border-0 bg-[#F0F7EE] soft-shadow"><CardHeader className="p-5 pb-0 sm:p-7 sm:pb-0"><SectionEyebrow>Career ↔ corpus bridge</SectionEyebrow><CardTitle className="mt-2 text-2xl tracking-[-0.05em] text-[#123328]">Make the salary milestones visible.</CardTitle></CardHeader><CardContent className="p-5 sm:p-7"><div className="space-y-5"><div className="flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-[#0F8A55]"><Clock3 className="h-4 w-4" /></div><div><p className="text-sm font-bold text-[#123328]">Year 1 · Protect the base</p><p className="mt-1 text-xs leading-5 text-[#557166]">Build an emergency buffer before increasing risk. Aim for a sustainable savings habit, not a heroic one.</p></div></div><div className="flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-[#0F8A55]"><BarChart3 className="h-4 w-4" /></div><div><p className="text-sm font-bold text-[#123328]">Year 3 · Fund the next jump</p><p className="mt-1 text-xs leading-5 text-[#557166]">At a 25% savings rate, a monthly target of {money(monthlyRetirementNeed)} implies a monthly income milestone near <strong className="text-[#0B5D3B]">{money(monthlyRetirementNeed / 0.25)}</strong>.</p></div></div><div className="flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-[#0F8A55]"><BrainCircuit className="h-4 w-4" /></div><div><p className="text-sm font-bold text-[#123328]">Year 5+ · Buy back your choices</p><p className="mt-1 text-xs leading-5 text-[#557166]">Use your {profile.goal} roadmap to grow earning power, then redirect each raise into education, health, and diversified assets.</p></div></div></div><div className="mt-7 rounded-2xl border border-[#D5E5D6] bg-white/70 p-4"><div className="flex items-center gap-2 text-xs font-semibold text-[#0B5D3B]"><LockKeyhole className="h-3.5 w-3.5" /> Keep the goal bigger than the product.</div><p className="mt-2 text-[11px] leading-5 text-[#557166]">AzadiPath is a planning companion. Before investing, review suitability, fees, taxes, liquidity, and risk with a licensed professional.</p></div></CardContent></Card>
        </section>

        <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-[#D5E5D6] pt-5 text-[11px] text-[#557166] sm:flex-row sm:items-center"><p><strong className="text-[#123328]">AzadiPath</strong> · Pakistan @ 79 · personal progress is national progress.</p><p>Demo mode · projections are illustrative, not guarantees.</p></footer>
      </div>
    </div>
  );
}
