"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Stage = "Applied" | "Interview" | "Offer";

type Application = {
  id: string;
  company: string;
  role: string;
  stage: Stage;
  source: string;
  note?: string;
};

const initialApplications: Application[] = [
  {
    id: "1",
    company: "Arcadia Systems",
    role: "Product Designer",
    stage: "Applied",
    source: "Referred",
    note: "Follow up in 3 days",
  },
  {
    id: "2",
    company: "Northwind",
    role: "UX Engineer",
    stage: "Interview",
    source: "Inbound",
    note: "Portfolio walkthrough scheduled",
  },
  {
    id: "3",
    company: "Skyline AI",
    role: "Design Lead",
    stage: "Applied",
    source: "Job board",
  },
  {
    id: "4",
    company: "Harbor Labs",
    role: "Product Manager",
    stage: "Offer",
    source: "Recruiter",
  },
];

type EmailParseResult = {
  company: string;
  role: string;
  location: string;
};

const baseMarketDataByCity: Record<string, number> = {
  Remote: 1,
  Seattle: 1.08,
  Austin: 1.02,
  "New York": 1.12,
  "San Francisco": 1.18,
};

const rejectionSignals = [
  { pattern: "Late responses", weight: 0.32, tip: "Follow up within 24 hours.", trend: "up" as const },
  { pattern: "Portfolio depth", weight: 0.27, tip: "Add 2 case studies with outcomes.", trend: "flat" as const },
  { pattern: "Salary mismatch", weight: 0.18, tip: "Share a range early to reduce mismatch.", trend: "down" as const },
  { pattern: "Tech stack gap", weight: 0.12, tip: "Highlight adjacent tools and ramp plans.", trend: "flat" as const },
];

type PrepPack = {
  summary: string;
  signals: string[];
  questions: string[];
};

const buildPrepPack = (company: string): PrepPack => ({
  summary: `${company} is leaning into efficiency; highlight outcomes tied to revenue and retention.`,
  signals: [
    "Recent funding round prioritizes measurable wins",
    "Design org hiring for systems maturity",
    "Expect emphasis on collaboration with eng and data",
  ],
  questions: [
    "How is design success measured in the first 90 days?",
    "Where does this role accelerate the roadmap immediately?",
    "What has worked well with cross-functional rituals?",
  ],
});

const columns: Stage[] = ["Applied", "Interview", "Offer"];

export default function Home() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverStage, setHoverStage] = useState<Stage | null>(null);
  const [emailText, setEmailText] = useState(
    "Hi Taylor, we'd like to invite you to interview for the Product Designer role at Aurora in Seattle."
  );
  const [parsedEmail, setParsedEmail] = useState<EmailParseResult | null>(null);
  const [prepCompany, setPrepCompany] = useState("Aurora");
  const [prepPack, setPrepPack] = useState<PrepPack | null>(buildPrepPack("Aurora"));
  const [prepExpanded, setPrepExpanded] = useState(true);
  const [baseSalary, setBaseSalary] = useState(145000);
  const [location, setLocation] = useState("Remote");
  const [marketPercentile, setMarketPercentile] = useState(75);
  const [mood, setMood] = useState(6);
  const [snoozeNudges, setSnoozeNudges] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<Record<string, number>>(baseMarketDataByCity);
  const [marketLastUpdated, setMarketLastUpdated] = useState<string | null>(null);
  const [userId, setUserId] = useState("demo-user");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(false);

  const signalTrends = {
    up: { arrow: "↑", tone: "text-amber-200" },
    flat: { arrow: "→", tone: "text-slate-200" },
    down: { arrow: "↓", tone: "text-emerald-200" },
  } as const;

  const board = useMemo(
    () =>
      columns.map((stage) => ({
        stage,
        items: applications.filter((item) => item.stage === stage),
      })),
    [applications]
  );

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch("/api/market-data");
        if (!res.ok) return;
        const json = await res.json();
        if (json?.multipliers) {
          setMarketData(json.multipliers);
          if (json.lastUpdated) setMarketLastUpdated(json.lastUpdated);
        }
      } catch (error) {
        console.error("Market data fetch failed", error);
      }
    };
    const loadPipeline = async () => {
      setIsLoadingPipeline(true);
      try {
        const res = await fetch(`/api/pipeline?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.applications)) {
          setApplications(json.applications);
        }
      } catch (error) {
        console.error("Pipeline load failed", error);
      } finally {
        setIsLoadingPipeline(false);
      }
    };

    fetchMarketData();
    loadPipeline();
  }, [userId]);

  const handleDrop = (stage: Stage, id: string | null) => {
    if (!id) return;
    setApplications((prev) => prev.map((item) => (item.id === id ? { ...item, stage } : item)));
    if (stage === "Interview") {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast("Moved to Interview");
      toastTimer.current = setTimeout(() => setToast(null), 2200);
    }
    setDraggingId(null);
    setHoverStage(null);
  };

  const handleEmailParse = async () => {
    try {
      const res = await fetch("/api/parse-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: emailText }),
      });
      if (!res.ok) throw new Error("parse failed");
      const result = (await res.json()) as EmailParseResult & { source?: string };
      setParsedEmail(result);
      const newId = String(Date.now());
      setApplications((prev) => [
        {
          id: newId,
          company: result.company,
          role: result.role,
          stage: "Applied",
          source: result.source ?? "Parsed email",
          note: `Location: ${result.location}`,
        },
        ...prev,
      ]);
      setJustAddedId(newId);
      setTimeout(() => setJustAddedId(null), 2400);
    } catch (error) {
      console.error("Email parse failed", error);
    }
  };

  const handlePrep = () => {
    setPrepPack(buildPrepPack(prepCompany || "The company"));
  };

  const recommendedAsk = useMemo(() => {
    const marketMultiplier = marketData[location] ?? 1;
    const percentileMultiplier = 0.8 + marketPercentile / 100;
    return Math.round(baseSalary * marketMultiplier * percentileMultiplier);
  }, [baseSalary, location, marketPercentile, marketData]);

  const moodNudge = useMemo(() => {
    if (mood >= 8) return "🔥 You are on a roll—schedule a proactive reach-out while energy is high.";
    if (mood >= 5) return "Steady wins—set one small task and reward yourself after.";
    return "Take a breather; queue one low-effort action like a short follow-up.";
  }, [mood]);

  const copySalaryRationale = async () => {
    const rationale = `Ask for $${recommendedAsk.toLocaleString()} based on ${location} market multiplier (${marketData[location] ?? 1}x) and ${marketPercentile}th percentile.`;
    try {
      await navigator.clipboard.writeText(rationale);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast("Salary rationale copied");
      toastTimer.current = setTimeout(() => setToast(null), 1800);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  const advanceStage = (id: string, stage: Stage) => {
    const nextStageIndex = columns.indexOf(stage) + 1;
    const nextStage = columns[nextStageIndex];
    if (!nextStage) return;
    setApplications((prev) => prev.map((item) => (item.id === id ? { ...item, stage: nextStage } : item)));
    if (nextStage === "Interview") {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast("Moved to Interview");
      toastTimer.current = setTimeout(() => setToast(null), 2200);
    }
  };

  const breathingNudge = () => {
    setToast("Breathing for 60s—slow inhale, longer exhale");
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const savePipeline = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, applications }),
      });
      if (!res.ok) throw new Error("save failed");
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast("Pipeline saved");
      toastTimer.current = setTimeout(() => setToast(null), 1800);
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const reloadPipeline = async () => {
    setIsLoadingPipeline(true);
    try {
      const res = await fetch(`/api/pipeline?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error("load failed");
      const json = await res.json();
      if (Array.isArray(json.applications)) {
        setApplications(json.applications);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast("Pipeline loaded");
        toastTimer.current = setTimeout(() => setToast(null), 1800);
      }
    } catch (error) {
      console.error("Reload failed", error);
    } finally {
      setIsLoadingPipeline(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">AI-powered tracker</p>
            <h1 className="text-3xl font-semibold leading-tight text-white">Calm, clear job search</h1>
            <p className="text-sm text-slate-200/80">Pipeline clarity, email parsing, interview prep, and grounded salary guidance.</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">LLM-assisted</span>
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-sky-200">Anxiety-aware</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-100">
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-36 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                placeholder="user id"
              />
              <button
                onClick={reloadPipeline}
                className="rounded-lg bg-white/10 px-3 py-2 font-semibold transition hover:bg-white/20"
                disabled={isLoadingPipeline}
              >
                {isLoadingPipeline ? "Loading..." : "Load"}
              </button>
              <button
                onClick={savePipeline}
                className="rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-slate-950 transition hover:bg-emerald-400"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {board.map(({ stage, items }) => (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setHoverStage(stage)}
              onDragLeave={() => setHoverStage(null)}
              onDrop={(e) => handleDrop(stage, e.dataTransfer.getData("text"))}
              className={`rounded-2xl border bg-white/5 p-4 shadow-lg shadow-slate-950/40 transition ${
                hoverStage === stage ? "border-emerald-300/60 bg-emerald-300/5" : "border-white/10"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{stage}</h2>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-100">{items.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggingId(item.id);
                      e.dataTransfer.setData("text", item.id);
                    }}
                    className={`cursor-grab rounded-xl border border-white/10 bg-slate-900/80 p-5 text-base transition ring-1 ring-transparent hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/50 sm:text-sm ${
                      draggingId === item.id ? "ring-emerald-400" : ""
                    } ${justAddedId === item.id ? "ring-amber-300/90 shadow-amber-500/30" : ""}`}
                  >
                    <div className="flex items-center justify-between text-sm text-slate-200">
                      <span className="font-semibold text-white">{item.company}</span>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-100">{item.source}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-100">{item.role}</p>
                    {item.note ? <p className="mt-2 text-xs text-slate-300">{item.note}</p> : null}
                    <button
                      onClick={() => advanceStage(item.id, item.stage)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-emerald-500/20 sm:hidden"
                    >
                      Tap to advance
                    </button>
                  </article>
                ))}
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/15 bg-slate-900/60 p-4 text-center text-sm text-slate-300">
                    Drop an application here to progress it.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-950/40">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Email parsing</h2>
              <span className="text-xs text-slate-200/80">Auto-create from inbox</span>
            </div>
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              className="mt-2 min-h-[140px] w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
            <p className="mt-2 text-xs text-slate-300">We’ll pull company, role, and location, then create a card in Applied.</p>
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={handleEmailParse}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Parse email and add
              </button>
              {parsedEmail ? (
                <p className="text-xs text-emerald-100">
                  Added {parsedEmail.role} @ {parsedEmail.company} ({parsedEmail.location})
                </p>
              ) : (
                <p className="text-xs text-slate-300">LLM extracts company, role, and location.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-950/40">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Interview prep mode</h2>
              <span className="text-xs text-slate-200/80">Company brief + talking points</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={prepCompany}
                onChange={(e) => setPrepCompany(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                placeholder="Company name"
              />
              <button
                onClick={handlePrep}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                Generate prep
              </button>
            </div>
            {prepPack ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-slate-100">{prepPack.summary}</p>
                  <button
                    onClick={() => setPrepExpanded((prev) => !prev)}
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/20 sm:hidden"
                  >
                    {prepExpanded ? "Collapse" : "Expand"}
                  </button>
                </div>
                {prepExpanded && (
                  <div className="grid gap-3 divide-y divide-white/10">
                    <div className="pt-1">
                      <p className="text-xs uppercase tracking-wide text-slate-300">Signals</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-100">
                        {prepPack.signals.map((signal) => (
                          <li key={signal}>{signal}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs uppercase tracking-wide text-slate-300">Questions to ask</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-100">
                        {prepPack.questions.map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-950/40 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Salary negotiation calculator</h2>
              <span className="text-xs text-slate-200/80">Anchored to market</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Target base ($)
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Location
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
                >
                  {Object.keys(marketData).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2 flex flex-col gap-2 text-sm text-slate-200">
                Market percentile ({marketPercentile}th)
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={1}
                  value={marketPercentile}
                  onChange={(e) => setMarketPercentile(Number(e.target.value))}
                  className="accent-emerald-400"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-100">
              <p className="text-base font-semibold text-emerald-200">Recommended ask: ${recommendedAsk.toLocaleString()}</p>
              <p className="text-slate-200/80">
                Anchored by city multiplier and market percentile to keep counters defensible.
                {marketLastUpdated ? ` (Market data: ${marketLastUpdated})` : ""}
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                <button
                  onClick={copySalaryRationale}
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Copy salary rationale
                </button>
              </div>
              <div className="mt-4 grid gap-1 sm:grid-cols-3 text-xs text-slate-300">
                <div className="rounded-lg bg-white/20 px-3 py-2">
                  <p className="text-slate-200">City multiplier</p>
                  <p className="text-slate-50">{marketData[location] ?? 1}x</p>
                </div>
                <div className="rounded-lg bg-white/20 px-3 py-2">
                  <p className="text-slate-200">Percentile factor</p>
                  <p className="text-slate-50">{(0.8 + marketPercentile / 100).toFixed(2)}x</p>
                </div>
                <div className="rounded-lg bg-white/20 px-3 py-2">
                  <p className="text-slate-200">Confidence</p>
                  <p className="text-slate-50">Prepared with current market data</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-950/40">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Rejection analytics</h2>
              <span className="text-xs text-slate-200/80">Pattern detection</span>
            </div>
            <div className="space-y-2">
              {rejectionSignals.map((signal) => (
                <div
                  key={signal.pattern}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                >
                  <div>
                    <p className="font-semibold text-white">{signal.pattern}</p>
                    <p className="text-xs text-slate-300">{signal.tip}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-sm ${signalTrends[signal.trend].tone}`}>
                    <span aria-hidden>{signalTrends[signal.trend].arrow}</span>
                    <span>{Math.round(signal.weight * 100)}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-950/40">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Mental health check-in</h2>
              <span className="text-xs text-slate-200/80">Stay balanced</span>
            </div>
            <label className="flex flex-col gap-2 text-sm text-slate-200">
              Mood today ({mood}/10)
              <input
                type="range"
                min={1}
                max={10}
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="accent-sky-400"
              />
            </label>
            <div className="mt-3 flex items-center gap-3 text-sm text-slate-100">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={snoozeNudges}
                  onChange={(e) => setSnoozeNudges(e.target.checked)}
                  className="accent-emerald-400"
                />
                Snooze nudges
              </label>
              <button
                onClick={breathingNudge}
                className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
              >
                Start 60s breathing
              </button>
            </div>
            <p className="mt-3 rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-100">
              {snoozeNudges ? "Nudges paused—pick one small task when you’re ready." : moodNudge}
            </p>
            <div className="mt-3 flex gap-2 text-xs text-slate-300">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100">Breathe</span>
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-sky-100">Micro-win</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">Pause alerts</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-slate-950/40">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Focus console</h2>
              <span className="text-xs text-slate-200/80">Reduce anxiety with clarity</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-100">
              <li className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                Today: move 2 cards forward and send 1 follow-up.
              </li>
              <li className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                Interview prep: lock 3 talking points for {prepCompany}.
              </li>
              <li className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                Salary: align ask to ${recommendedAsk.toLocaleString()} with rationale.
              </li>
            </ul>
          </div>
        </section>

        {toast ? (
          <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/50 backdrop-blur">
              {toast}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
