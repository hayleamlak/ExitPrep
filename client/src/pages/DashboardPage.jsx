import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, Filter, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function StatTile({ label, value, helper, palette, accent }) {
  return (
    <article className={`rounded-2xl border p-4 sm:p-5 ${palette.card} ${palette.cardBorder}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.25em] ${palette.meta}`}>{label}</p>
      <p className={`mt-2 text-3xl font-bold sm:text-4xl ${accent || palette.title}`}>{value}</p>
      <p className={`mt-2 text-sm ${palette.meta}`}>{helper}</p>
    </article>
  );
}

function TopicBar({ item, palette, isWeak = false }) {
  const accuracy = clamp(item.accuracyPercentage);

  return (
    <article className={`rounded-2xl border p-4 ${palette.card} ${palette.cardBorder}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`truncate font-semibold ${palette.title}`}>{item.topic}</p>
          <p className={`mt-1 text-sm ${palette.meta}`}>{item.attempts} attempts</p>
        </div>
        <p className={`text-lg font-bold ${isWeak ? palette.bad : palette.good}`}>{Math.round(accuracy)}%</p>
      </div>

      <div className={`mt-3 h-2 overflow-hidden rounded-full ${palette.progressTrack}`}>
        <div
          className={`h-full rounded-full ${isWeak ? palette.progressWeak : palette.progressStrong}`}
          style={{ width: `${accuracy}%` }}
        />
      </div>
    </article>
  );
}

function DashboardPage() {
  const { isDark } = useTheme();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [aiWeakSubjects, setAiWeakSubjects] = useState([]);
  const [aiWeeklySchedule, setAiWeeklySchedule] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiLastGeneratedAt, setAiLastGeneratedAt] = useState("");

  const palette = isDark
    ? {
        title: "text-white",
        meta: "text-slate-400",
        divider: "border-white/10",
        card: "bg-[#0d1427]",
        cardBorder: "border-white/10 hover:border-white/20",
        progressTrack: "bg-white/10",
        progressStrong: "bg-cyan-400",
        progressWeak: "bg-rose-400",
        good: "text-emerald-300",
        bad: "text-rose-300",
        accent: "text-cyan-300",
        chip: "border-white/10 bg-white/5 text-slate-200",
        select: "border-white/10 bg-white/5 text-slate-100"
      }
    : {
        title: "text-slate-900",
        meta: "text-slate-500",
        divider: "border-slate-200",
        card: "bg-white",
        cardBorder: "border-slate-200 hover:border-slate-300",
        progressTrack: "bg-slate-200",
        progressStrong: "bg-sky-500",
        progressWeak: "bg-rose-500",
        good: "text-emerald-600",
        bad: "text-rose-600",
        accent: "text-sky-600",
        chip: "border-slate-300 bg-white text-slate-700",
        select: "border-slate-300 bg-white text-slate-700"
      };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await api.get("/attempts/courses");
        const fetchedCourses = Array.isArray(response.data) ? response.data : [];
        setCourses(fetchedCourses);
      } catch (_error) {
        setCourses([]);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      setError("");

      try {
        const params = selectedCourse !== "all" ? { course: selectedCourse } : {};
        const response = await api.get("/attempts/insights", { params });
        setInsights(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load insights data.");
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [selectedCourse]);

  const overall = insights?.overall || {
    totalAttempts: 0,
    correctAnswers: 0,
    accuracyPercentage: 0,
    averageScore: 0
  };

  const insightsBySubject = Array.isArray(insights?.insightsBySubject) ? insights.insightsBySubject : [];
  const showPerSubjectInsights = selectedCourse === "all";

  const strongTopics = useMemo(() => {
    const list = Array.isArray(insights?.groupedByTopic) ? insights.groupedByTopic : [];
    return list
      .slice()
      .sort((a, b) => b.accuracyPercentage - a.accuracyPercentage || b.attempts - a.attempts)
      .slice(0, 5);
  }, [insights]);

  const weakTopics = Array.isArray(insights?.weakAreas) ? insights.weakAreas : [];
  const recentAttempts = Array.isArray(insights?.recentAttempts) ? insights.recentAttempts : [];

  const currentCourseLabel =
    selectedCourse === "all" ? "All courses" : selectedCourse;

  const generateAiRecommendation = async () => {
    setAiLoading(true);
    setAiError("");

    try {
      const response = await api.post("/ai/study-plan", {
        courseName: selectedCourse === "all" ? "" : selectedCourse,
        hoursPerWeek: 10,
        preferredStudyTime: "evening",
        autoFromAttempts: true
      });

      const planData = response.data?.data || {};
      const schedule = Array.isArray(planData.weeklySchedule)
        ? planData.weeklySchedule
        : Array.isArray(planData.dailySchedule)
          ? planData.dailySchedule
          : [];

      setAiRecommendation(typeof planData.explanation === "string" ? planData.explanation : "No recommendation returned.");
      setAiWeakSubjects(Array.isArray(planData.focusAreas) ? planData.focusAreas : []);
      setAiWeeklySchedule(schedule);
      setAiLastGeneratedAt(new Date().toISOString());
    } catch (err) {
      setAiError(err.response?.data?.message || "Failed to generate AI recommendation.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className={`border-b pb-6 ${palette.divider}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${palette.meta}`}>Insights</p>
            <h1 className={`mt-2 text-2xl font-bold tracking-tight sm:text-4xl ${palette.title}`}>
              Course performance analytics
            </h1>
            <p className={`mt-2 max-w-3xl text-sm sm:text-base ${palette.meta}`}>
              Dynamic performance metrics by course and topic from real attempts stored in the database.
            </p>
          </div>

          <label className="flex items-center gap-2">
            <Filter size={16} className={palette.meta} />
            <select
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
              className={`rounded-xl border px-3 py-2 text-sm outline-none ${palette.select}`}
            >
              <option value="all">All courses</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {loading ? <p className={`text-sm ${palette.meta}`}>Loading insights...</p> : null}
      {error ? <p className={`rounded-xl border px-3 py-2 text-sm ${palette.bad} ${palette.card} ${palette.cardBorder}`}>{error}</p> : null}

      <article className={`rounded-[26px] border p-5 sm:p-6 ${palette.card} ${palette.cardBorder}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className={palette.accent} />
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${palette.meta}`}>AI Coach</p>
              <h2 className={`mt-2 text-xl font-bold ${palette.title}`}>Personalized study plan</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={generateAiRecommendation}
            disabled={aiLoading}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${palette.chip}`}
          >
            {aiLoading ? "Generating..." : aiRecommendation ? "Regenerate Plan" : "Generate Plan"}
          </button>
        </div>

        {aiError ? <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${palette.bad} ${palette.card} ${palette.cardBorder}`}>{aiError}</p> : null}

        {aiRecommendation ? (
          <div className="mt-4 space-y-3">
            <p className={`whitespace-pre-wrap text-sm leading-relaxed ${palette.meta}`}>{aiRecommendation}</p>
            {aiWeakSubjects.length ? (
              <div className="flex flex-wrap gap-2">
                {aiWeakSubjects.map((subject) => (
                  <span key={subject} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${palette.chip}`}>
                    {subject}
                  </span>
                ))}
              </div>
            ) : null}
            {aiWeeklySchedule.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {aiWeeklySchedule.map((dayPlan, index) => (
                  <article key={`${dayPlan.day || "day"}-${index}`} className={`rounded-xl border p-3 ${palette.card} ${palette.cardBorder}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-semibold ${palette.title}`}>{dayPlan.day || `Day ${index + 1}`}</p>
                      <p className={`text-xs ${palette.meta}`}>{Math.round(Number(dayPlan.durationMinutes || 0))} min</p>
                    </div>
                    <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.14em] ${palette.meta}`}>{dayPlan.focus || "Focused review"}</p>
                    <ul className={`mt-2 space-y-1 text-sm ${palette.meta}`}>
                      {(Array.isArray(dayPlan.tasks) ? dayPlan.tasks : []).slice(0, 3).map((task, taskIndex) => (
                        <li key={`${index}-task-${taskIndex}`}>- {task}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : null}
            {aiLastGeneratedAt ? <p className={`text-xs ${palette.meta}`}>Generated at {formatDate(aiLastGeneratedAt)}</p> : null}
          </div>
        ) : (
          <p className={`mt-4 text-sm ${palette.meta}`}>
            Generate an AI study plan based on your current topic performance and weak areas.
          </p>
        )}
      </article>

      {!loading && !error ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${palette.chip}`}>
              {currentCourseLabel}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {showPerSubjectInsights
              ? insightsBySubject.map((item) => (
                  <StatTile
                    key={item.subject}
                    label={item.subject}
                    value={`${Math.round(item.accuracyPercentage)}%`}
                    helper={`${item.correctAnswers}/${item.totalAttempts} correct attempts`}
                    palette={palette}
                    accent={palette.good}
                  />
                ))
              : (
                <>
                  <StatTile
                    label="Total Attempts"
                    value={overall.totalAttempts}
                    helper="All answered questions for this filter."
                    palette={palette}
                  />
                  <StatTile
                    label="Correct Answers"
                    value={overall.correctAnswers}
                    helper="Correct responses recorded."
                    palette={palette}
                  />
                  <StatTile
                    label="Accuracy"
                    value={`${Math.round(overall.accuracyPercentage)}%`}
                    helper="Correct answers divided by total attempts."
                    palette={palette}
                    accent={palette.good}
                  />
                  <StatTile
                    label="Average Score"
                    value={`${Math.round(overall.averageScore)}%`}
                    helper="Average score for selected course attempts."
                    palette={palette}
                    accent={palette.accent}
                  />
                </>
              )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <article className={`rounded-[26px] border p-5 sm:p-6 ${palette.card} ${palette.cardBorder}`}>
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className={palette.good} />
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${palette.meta}`}>Topic Strengths</p>
                  <h2 className={`mt-2 text-xl font-bold ${palette.title}`}>Top performing topics</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {strongTopics.length ? (
                  strongTopics.map((item) => <TopicBar key={`strong-${item.topic}`} item={item} palette={palette} />)
                ) : (
                  <p className={`text-sm ${palette.meta}`}>No topic data available yet.</p>
                )}
              </div>
            </article>

            <article className={`rounded-[26px] border p-5 sm:p-6 ${palette.card} ${palette.cardBorder}`}>
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className={palette.bad} />
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${palette.meta}`}>Weak Areas</p>
                  <h2 className={`mt-2 text-xl font-bold ${palette.title}`}>Topics needing attention</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {weakTopics.length ? (
                  weakTopics.map((item) => (
                    <TopicBar key={`weak-${item.topic}`} item={item} palette={palette} isWeak />
                  ))
                ) : (
                  <p className={`text-sm ${palette.meta}`}>No weak areas detected yet.</p>
                )}
              </div>
            </article>
          </div>

          <article className={`rounded-[26px] border p-5 sm:p-6 ${palette.card} ${palette.cardBorder}`}>
            <div className="flex items-center gap-2">
              <Clock3 size={18} className={palette.meta} />
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${palette.meta}`}>Recent Sessions</p>
                <h2 className={`mt-2 text-xl font-bold ${palette.title}`}>Latest answered questions</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recentAttempts.length ? (
                recentAttempts.map((item, index) => (
                  <div
                    key={`${item.topic}-${item.createdAt}-${index}`}
                    className={`rounded-xl border px-4 py-3 ${palette.card} ${palette.cardBorder}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate font-semibold ${palette.title}`}>{item.topic}</p>
                        <p className={`text-sm ${palette.meta}`}>{item.course}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${item.isCorrect ? palette.good : palette.bad}`}>
                          {item.isCorrect ? "Correct" : "Wrong"}
                        </p>
                        <p className={`text-xs ${palette.meta}`}>{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid min-h-40 place-items-center text-center">
                  <div>
                    <AlertTriangle size={28} className={palette.meta} />
                    <p className={`mt-2 text-sm ${palette.meta}`}>No attempts recorded yet. Answer questions to see live insights.</p>
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default DashboardPage;
