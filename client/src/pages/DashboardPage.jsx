import { Clock3, Sparkles, TrendingUp } from "lucide-react";

const proficiencyItems = [
  { id: "d1", title: "Automata and Complexity Theory", attempts: 0, score: 0, risk: "At Risk" },
  { id: "d2", title: "Compiler Design", attempts: 0, score: 0, risk: "At Risk" },
  { id: "d3", title: "Computer and Network Security", attempts: 0, score: 0, risk: "At Risk" },
  { id: "d4", title: "Computer Organization and Architecture", attempts: 0, score: 0, risk: "At Risk" },
  { id: "d5", title: "Data Communication and Networking", attempts: 0, score: 0, risk: "At Risk" }
];

function ProficiencyRow({ item }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0d1427] px-4 py-4 transition hover:border-white/20 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg sm:text-2xl font-semibold tracking-tight text-white">{item.title}</h3>
          <div className="mt-2 flex items-center gap-3 sm:gap-4">
            <div className="h-2 w-24 sm:w-40 rounded-full bg-white/10">
              <div className="h-full w-0 rounded-full bg-cyan-400" />
            </div>
            <p className="text-sm sm:text-base text-slate-400">{item.attempts} attempts</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Score</p>
          <p className="mt-1 text-xl sm:text-3xl font-bold text-white">{item.score}%</p>
        </div>

        <div className="w-20 sm:w-24 text-right">
          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs sm:text-sm font-bold text-amber-500">
            {item.risk}
          </span>
        </div>
      </div>
    </article>
  );
}

function DashboardPage() {
  return (
    <section className="space-y-6">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Insights</h1>
        <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl">
          Track your study progress and proficiency across all modules.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div>
          <div className="mb-4 flex items-center justify-between px-1">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-slate-200">Subject Proficiency</p>
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200"
            >
              Export Report
            </button>
          </div>

          <div className="space-y-4">
            {proficiencyItems.map((item) => (
              <ProficiencyRow key={item.id} item={item} />
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div>
            <p className="mb-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-slate-200">Performance Insights</p>
            <article className="rounded-2xl border border-white/10 bg-[#161b2d] p-4 sm:p-5">
              <div className="flex items-center gap-2 text-slate-300">
                <TrendingUp size={16} />
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em]">Diagnostic Summary</p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl sm:text-4xl font-bold text-white">0%</p>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">AVG SCORE</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-4xl font-bold text-white">0%</p>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">ACCURACY</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-4xl font-bold text-emerald-400">2%</p>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">PROB.</p>
                </div>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-cyan-400/20 bg-[#111727] p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-100 text-cyan-600">
                <Sparkles size={18} />
              </div>
              <p className="text-base sm:text-lg italic leading-relaxed text-slate-200">
                "Broaden your study. You've covered 0% of the curriculum."
              </p>
            </div>
          </article>

          <div>
            <p className="mb-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-slate-200">Session History</p>
            <article className="grid min-h-44 place-items-center rounded-2xl border border-white/10 bg-[#161b2d] p-5 text-center">
              <Clock3 size={30} className="text-slate-500" />
              <p className="mt-3 text-sm sm:text-base text-slate-400">No previous sessions found.</p>
            </article>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default DashboardPage;
