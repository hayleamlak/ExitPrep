import { Clock3, Sparkles, TrendingUp } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const proficiencyItems = [
  { id: "d1", title: "Automata and Complexity Theory", attempts: 0, score: 0, risk: "At Risk" },
  { id: "d2", title: "Compiler Design", attempts: 0, score: 0, risk: "At Risk" },
  { id: "d3", title: "Computer and Network Security", attempts: 0, score: 0, risk: "At Risk" },
  { id: "d4", title: "Computer Organization and Architecture", attempts: 0, score: 0, risk: "At Risk" },
  { id: "d5", title: "Data Communication and Networking", attempts: 0, score: 0, risk: "At Risk" }
];

function ProficiencyRow({ item, palette }) {
  return (
    <article
      className={`rounded-2xl border px-4 py-4 transition sm:px-5 sm:py-5 ${palette.card} ${palette.cardBorder}`}
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h3 className={`truncate text-lg sm:text-2xl font-semibold tracking-tight ${palette.title}`}>
            {item.title}
          </h3>
          <div className="mt-2 flex items-center gap-3 sm:gap-4">
            <div className={`h-2 w-24 sm:w-40 rounded-full ${palette.progressTrack}`}>
              <div className={`h-full w-0 rounded-full ${palette.progressFill}`} />
            </div>
            <p className={`text-sm sm:text-base ${palette.meta}`}>{item.attempts} attempts</p>
          </div>
        </div>

        <div className="text-right">
          <p className={`text-[0.7rem] font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Score</p>
          <p className={`mt-1 text-xl sm:text-3xl font-bold ${palette.title}`}>{item.score}%</p>
        </div>

        <div className="w-20 sm:w-24 text-right">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs sm:text-sm font-bold ${palette.riskBadge}`}>
            {item.risk}
          </span>
        </div>
      </div>
    </article>
  );
}

function DashboardPage() {
  const { isDark } = useTheme();

  const palette = isDark
    ? {
        title: "text-white",
        meta: "text-slate-400",
        subtleHeading: "text-slate-200",
        divider: "border-white/10",
        card: "bg-[#0d1427]",
        cardBorder: "border-white/10 hover:border-white/20",
        progressTrack: "bg-white/10",
        progressFill: "bg-cyan-400",
        button: "border-white/10 bg-white/5 text-slate-200",
        asideCard: "border-white/10 bg-[#161b2d]",
        quoteCard: "border-cyan-400/20 bg-[#111727]",
        iconWrap: "bg-cyan-100 text-cyan-600",
        accent: "text-emerald-400",
        riskBadge: "bg-amber-50 text-amber-500"
      }
    : {
        title: "text-slate-900",
        meta: "text-slate-500",
        subtleHeading: "text-slate-600",
        divider: "border-slate-200",
        card: "bg-white",
        cardBorder: "border-slate-200 hover:border-slate-300",
        progressTrack: "bg-slate-200",
        progressFill: "bg-sky-500",
        button: "border-slate-300 bg-white text-slate-700",
        asideCard: "border-slate-200 bg-white",
        quoteCard: "border-cyan-200 bg-cyan-50/60",
        iconWrap: "bg-cyan-100 text-cyan-700",
        accent: "text-emerald-600",
        riskBadge: "bg-amber-100 text-amber-700"
      };

  return (
    <section className="space-y-6">
      <header className={`border-b pb-6 ${palette.divider}`}>
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${palette.title}`}>Insights</h1>
        <p className={`mt-2 max-w-2xl text-sm sm:text-base ${palette.meta}`}>
          Track your study progress and proficiency across all modules.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div>
          <div className="mb-4 flex items-center justify-between px-1">
            <p className={`text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] ${palette.subtleHeading}`}>
              Subject Proficiency
            </p>
            <button
              type="button"
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${palette.button}`}
            >
              Export Report
            </button>
          </div>

          <div className="space-y-4">
            {proficiencyItems.map((item) => (
              <ProficiencyRow key={item.id} item={item} palette={palette} />
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div>
            <p className={`mb-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] ${palette.subtleHeading}`}>
              Performance Insights
            </p>
            <article className={`rounded-2xl border p-4 sm:p-5 ${palette.asideCard}`}>
              <div className={`flex items-center gap-2 ${palette.meta}`}>
                <TrendingUp size={16} />
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em]">Diagnostic Summary</p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className={`text-2xl sm:text-4xl font-bold ${palette.title}`}>0%</p>
                  <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] ${palette.meta}`}>AVG SCORE</p>
                </div>
                <div>
                  <p className={`text-2xl sm:text-4xl font-bold ${palette.title}`}>0%</p>
                  <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] ${palette.meta}`}>ACCURACY</p>
                </div>
                <div>
                  <p className={`text-2xl sm:text-4xl font-bold ${palette.accent}`}>2%</p>
                  <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] ${palette.meta}`}>PROB.</p>
                </div>
              </div>
            </article>
          </div>

          <article className={`rounded-2xl border p-4 sm:p-5 ${palette.quoteCard}`}>
            <div className="flex items-start gap-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${palette.iconWrap}`}>
                <Sparkles size={18} />
              </div>
              <p className={`text-base sm:text-lg italic leading-relaxed ${palette.title}`}>
                "Broaden your study. You've covered 0% of the curriculum."
              </p>
            </div>
          </article>

          <div>
            <p className={`mb-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] ${palette.subtleHeading}`}>
              Session History
            </p>
            <article className={`grid min-h-44 place-items-center rounded-2xl border p-5 text-center ${palette.asideCard}`}>
              <Clock3 size={30} className={palette.meta} />
              <p className={`mt-3 text-sm sm:text-base ${palette.meta}`}>No previous sessions found.</p>
            </article>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default DashboardPage;
