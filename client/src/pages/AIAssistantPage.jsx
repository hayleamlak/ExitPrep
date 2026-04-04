import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

const FEATURE_META = [
  { id: "summarize", title: "Summarize Notes", subtitle: "Turn uploaded course content into key points." },
  { id: "quiz", title: "Generate Quiz", subtitle: "Create questions directly from selected PDF notes." },
  { id: "explain", title: "Explain Answer", subtitle: "Understand why your answer is wrong or right." },
  { id: "recommend", title: "Weak Topic Actions", subtitle: "Get prioritized actions from performance data." },
  { id: "study-plan", title: "Weekly Study Plan", subtitle: "Build a data-driven 7-day plan from attempts." }
];

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function deriveTopicFromContent(content, fallback) {
  const text = String(content || "");
  const chapterMatch = text.match(/Chapter\s*\d+\s*:\s*([^\n]+)/i);
  if (chapterMatch?.[1]) {
    return chapterMatch[1].trim();
  }

  const line = text
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.length > 8 && item.length < 100);

  return line || fallback;
}

function outputCard(title, body, palette) {
  return (
    <article className={`rounded-2xl border p-4 ${palette.card} ${palette.border}`}>
      <h3 className={`text-sm font-semibold uppercase tracking-[0.18em] ${palette.meta}`}>{title}</h3>
      <div className="mt-3">{body}</div>
    </article>
  );
}

function AIAssistantPage() {
  const { isDark } = useTheme();
  const [activeFeature, setActiveFeature] = useState("study-plan");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const [sourceNotes, setSourceNotes] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(true);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [autoUseSelectedSource, setAutoUseSelectedSource] = useState(true);

  const [summaryForm, setSummaryForm] = useState({
    subject: "Object Oriented Programming",
    text: "Encapsulation bundles data and methods together and restricts direct access to internal state."
  });
  const [quizForm, setQuizForm] = useState({
    subject: "Object Oriented Programming",
    topic: "Encapsulation",
    difficulty: "medium",
    count: 5
  });
  const [explainForm, setExplainForm] = useState({
    topic: "Polymorphism",
    questionText: "Which concept allows one interface to support multiple forms?",
    selectedAnswer: "Inheritance",
    correctAnswer: "Polymorphism"
  });
  const [recommendForm, setRecommendForm] = useState({
    topicPerformance: JSON.stringify(
      [
        { topic: "Inheritance", accuracy: 48 },
        { topic: "Encapsulation", accuracy: 62 },
        { topic: "Polymorphism", accuracy: 39 }
      ],
      null,
      2
    )
  });
  const [planForm, setPlanForm] = useState({
    courseName: "",
    hoursPerWeek: 10,
    examDate: "",
    weakTopics: "",
    completedChapters: "",
    quizScores: "",
    timeSpent: "",
    autoFromAttempts: true,
    preferredStudyTime: "evening"
  });

  const [summaryResult, setSummaryResult] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [explainResult, setExplainResult] = useState(null);
  const [recommendResult, setRecommendResult] = useState(null);
  const [planResult, setPlanResult] = useState(null);

  const palette = isDark
    ? {
        page: "text-slate-100",
        card: "bg-[#0e172f]",
        softCard: "bg-white/5",
        border: "border-white/10",
        meta: "text-slate-400",
        text: "text-slate-100",
        input: "border-white/10 bg-white/5 text-slate-100",
        button: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20",
        tab: "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
        tabActive: "border-cyan-300/40 bg-cyan-300/20 text-cyan-100",
        danger: "text-rose-300"
      }
    : {
        page: "text-slate-900",
        card: "bg-white",
        softCard: "bg-slate-50",
        border: "border-slate-200",
        meta: "text-slate-500",
        text: "text-slate-800",
        input: "border-slate-300 bg-white text-slate-700",
        button: "border-sky-300 bg-sky-100 text-sky-900 hover:bg-sky-200",
        tab: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
        tabActive: "border-sky-300 bg-sky-100 text-sky-900",
        danger: "text-rose-600"
      };

  const selectedSource = useMemo(
    () => sourceNotes.find((item) => item._id === selectedSourceId) || null,
    [sourceNotes, selectedSourceId]
  );

  useEffect(() => {
    async function loadNotes() {
      setSourceLoading(true);
      try {
        const response = await api.get("/notes");
        const items = Array.isArray(response.data) ? response.data : [];
        setSourceNotes(items);
        if (items.length > 0) {
          setSelectedSourceId(items[0]._id);
        }
      } catch (_error) {
        setSourceNotes([]);
      } finally {
        setSourceLoading(false);
      }
    }

    loadNotes();
  }, []);

  async function runRequest(feature, endpoint, payload, setter) {
    setError("");
    setLoading(feature);

    try {
      const response = await api.post(endpoint, payload);
      setter(response.data);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to run ${feature}`);
    } finally {
      setLoading("");
    }
  }

  function applySourceToForms() {
    if (!selectedSource) {
      setError("Select an uploaded note first.");
      return;
    }

    const sourceSubject = selectedSource.course || selectedSource.name || "General";
    const sourceContent = String(selectedSource.content || "");
    const sourceTopic = deriveTopicFromContent(sourceContent, sourceSubject);

    setSummaryForm((prev) => ({ ...prev, subject: sourceSubject, text: sourceContent || prev.text }));
    setQuizForm((prev) => ({ ...prev, subject: sourceSubject, topic: sourceTopic }));
    setPlanForm((prev) => ({ ...prev, courseName: sourceSubject }));
    setError("");
  }

  async function generateAiPackFromSelectedSource() {
    if (!selectedSource) {
      setError("Select an uploaded note first.");
      return;
    }

    const sourceSubject = selectedSource.course || selectedSource.name || "General";
    const sourceContent = String(selectedSource.content || "");
    const sourceTopic = deriveTopicFromContent(sourceContent, sourceSubject);

    if (!sourceContent.trim()) {
      setError("Selected uploaded note does not contain content.");
      return;
    }

    setError("");
    setLoading("source-pack");

    try {
      const [summaryRes, quizRes, planRes] = await Promise.all([
        api.post("/ai/summarize", { subject: sourceSubject, text: sourceContent }),
        api.post("/ai/quiz", {
          subject: sourceSubject,
          topic: sourceTopic,
          difficulty: quizForm.difficulty,
          count: quizForm.count,
          sourceText: sourceContent
        }),
        api.post("/ai/study-plan", {
          courseName: sourceSubject,
          hoursPerWeek: planForm.hoursPerWeek,
          examDate: planForm.examDate,
          completedChapters: splitCsv(planForm.completedChapters),
          weakTopics: splitCsv(planForm.weakTopics),
          quizScores: splitCsv(planForm.quizScores).map((item) => Number(item)).filter((num) => Number.isFinite(num)),
          timeSpent: planForm.timeSpent,
          autoFromAttempts: planForm.autoFromAttempts,
          preferredStudyTime: planForm.preferredStudyTime
        })
      ]);

      setSummaryResult(summaryRes.data);
      setQuizResult(quizRes.data);
      setPlanResult(planRes.data);
      setActiveFeature("study-plan");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate AI pack from selected uploaded note.");
    } finally {
      setLoading("");
    }
  }

  const activeMeta = FEATURE_META.find((item) => item.id === activeFeature);

  const resultBlock = useMemo(() => {
    if (activeFeature === "summarize") {
      const payload = summaryResult?.data || {};
      return outputCard(
        "Summary Result",
        <div>
          <p className={`text-sm leading-relaxed ${palette.text}`}>{payload.shortSummary || "No summary yet."}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${palette.meta}`}>Key Points</p>
              <ul className={`mt-2 space-y-1 text-sm ${palette.text}`}>
                {(Array.isArray(payload.keyPoints) ? payload.keyPoints : []).map((item, idx) => <li key={`kp-${idx}`}>- {item}</li>)}
              </ul>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${palette.meta}`}>Exam Tips</p>
              <ul className={`mt-2 space-y-1 text-sm ${palette.text}`}>
                {(Array.isArray(payload.examTips) ? payload.examTips : []).map((item, idx) => <li key={`tip-${idx}`}>- {item}</li>)}
              </ul>
            </div>
          </div>
        </div>,
        palette
      );
    }

    if (activeFeature === "quiz") {
      const questions = quizResult?.data?.questions || [];
      return outputCard(
        "Generated Quiz",
        <div className="space-y-3">
          {questions.length
            ? questions.map((question, index) => (
                <div key={`q-${index}`} className={`rounded-xl border p-3 ${palette.softCard} ${palette.border}`}>
                  <p className={`text-sm font-semibold ${palette.text}`}>{index + 1}. {question.questionText}</p>
                  <ul className={`mt-2 space-y-1 text-sm ${palette.text}`}>
                    {(Array.isArray(question.options) ? question.options : []).map((option) => (
                      <li key={`${index}-${option}`}>- {option}</li>
                    ))}
                  </ul>
                  <p className={`mt-2 text-xs ${palette.meta}`}>Answer: {question.correctAnswer}</p>
                </div>
              ))
            : <p className={`text-sm ${palette.meta}`}>No quiz generated yet.</p>}
        </div>,
        palette
      );
    }

    if (activeFeature === "explain") {
      const payload = explainResult?.data || {};
      return outputCard(
        "Explanation Result",
        <div className={`space-y-2 text-sm ${palette.text}`}>
          <p><span className={palette.meta}>Correct logic:</span> {payload.whyCorrect || "N/A"}</p>
          <p><span className={palette.meta}>Your answer:</span> {payload.whyStudentAnswer || "N/A"}</p>
          <p><span className={palette.meta}>Memory tip:</span> {payload.memoryTip || "N/A"}</p>
        </div>,
        palette
      );
    }

    if (activeFeature === "recommend") {
      const weakTopics = recommendResult?.data?.weakTopics || [];
      const priorities = recommendResult?.data?.priorities || [];
      return outputCard(
        "Weak Topic Recommendations",
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${palette.meta}`}>Weak Topics</p>
            <ul className={`mt-2 space-y-1 text-sm ${palette.text}`}>
              {weakTopics.map((topic, idx) => <li key={`weak-${idx}`}>- {topic.topic} ({Math.round(Number(topic.accuracy || 0))}%)</li>)}
            </ul>
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${palette.meta}`}>Actions</p>
            <ul className={`mt-2 space-y-1 text-sm ${palette.text}`}>
              {priorities.map((item, idx) => <li key={`priority-${idx}`}>- {item.topic}: {item.action}</li>)}
            </ul>
          </div>
        </div>,
        palette
      );
    }

    const payload = planResult?.data || {};
    const schedule = Array.isArray(payload.weeklySchedule)
      ? payload.weeklySchedule
      : Array.isArray(payload.dailySchedule)
        ? payload.dailySchedule
        : [];

    return outputCard(
      "Weekly Study Plan",
      <div>
        <p className={`text-sm ${palette.text}`}>{payload.explanation || "No plan generated yet."}</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {schedule.map((day, index) => (
            <div key={`${day.day || "day"}-${index}`} className={`rounded-xl border p-3 ${palette.softCard} ${palette.border}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-semibold ${palette.text}`}>{day.day || `Day ${index + 1}`}</p>
                <p className={`text-xs ${palette.meta}`}>{Math.round(Number(day.durationMinutes || 0))} min</p>
              </div>
              <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.15em] ${palette.meta}`}>{day.focus || "Focused practice"}</p>
              <ul className={`mt-2 space-y-1 text-sm ${palette.text}`}>
                {(Array.isArray(day.tasks) ? day.tasks : []).slice(0, 4).map((task, taskIndex) => <li key={`${index}-${taskIndex}`}>- {task}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>,
      palette
    );
  }, [activeFeature, summaryResult, quizResult, explainResult, recommendResult, planResult, palette]);

  return (
    <section className={`space-y-6 ${palette.page}`}>
      <header className={`rounded-[26px] border p-5 sm:p-6 ${palette.card} ${palette.border}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${palette.meta}`}>AI Hub</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Generate Everything From Uploaded PDF Content</h1>
            <p className={`mt-2 max-w-3xl text-sm sm:text-base ${palette.meta}`}>
              Select one uploaded note source and run summary, quiz, and plan generation directly from that content.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${palette.border} ${palette.softCard}`}>
            <Bot size={14} />
            AI-first workflow
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <select
            value={selectedSourceId}
            onChange={(event) => setSelectedSourceId(event.target.value)}
            className={`rounded-lg border px-3 py-2 text-sm outline-none ${palette.input}`}
            disabled={sourceLoading || sourceNotes.length === 0}
          >
            {sourceLoading ? <option value="">Loading uploaded notes...</option> : null}
            {!sourceLoading && sourceNotes.length === 0 ? <option value="">No uploaded notes available</option> : null}
            {sourceNotes.map((item) => (
              <option key={item._id} value={item._id}>{item.course || item.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={applySourceToForms}
            disabled={!selectedSource}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${palette.button}`}
          >
            Use Source In Forms
          </button>

          <button
            type="button"
            onClick={generateAiPackFromSelectedSource}
            disabled={!selectedSource || loading === "source-pack"}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${palette.button}`}
          >
            {loading === "source-pack" ? "Generating AI Pack..." : "Generate AI Pack"}
          </button>
        </div>

        <label className={`mt-3 flex items-center gap-2 text-sm ${palette.text}`}>
          <input
            type="checkbox"
            checked={autoUseSelectedSource}
            onChange={(event) => setAutoUseSelectedSource(event.target.checked)}
          />
          Use selected uploaded source automatically for summarize and quiz actions
        </label>
      </header>

      <section className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className={`rounded-2xl border p-4 ${palette.card} ${palette.border}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Features</p>
          <div className="mt-3 space-y-2">
            {FEATURE_META.map((item) => {
              const isActive = item.id === activeFeature;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveFeature(item.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${isActive ? palette.tabActive : palette.tab}`}
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs opacity-85">{item.subtitle}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4">
          <article className={`rounded-2xl border p-4 ${palette.card} ${palette.border}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Current Tool</p>
                <h2 className="mt-1 text-xl font-bold">{activeMeta?.title}</h2>
                <p className={`mt-1 text-sm ${palette.meta}`}>{activeMeta?.subtitle}</p>
              </div>
              {loading ? (
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${palette.border} ${palette.softCard}`}>
                  <LoaderCircle size={14} className="animate-spin" /> Running {loading}
                </div>
              ) : (
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${palette.border} ${palette.softCard}`}>
                  <CheckCircle2 size={14} /> Ready
                </div>
              )}
            </div>

            {error ? <p className={`mt-3 rounded-xl border px-3 py-2 text-sm ${palette.danger} ${palette.border}`}>{error}</p> : null}

            {activeFeature === "summarize" ? (
              <div className="mt-4 space-y-2">
                <input className={`w-full rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={summaryForm.subject} onChange={(event) => setSummaryForm((prev) => ({ ...prev, subject: event.target.value }))} placeholder="Subject" />
                <textarea className={`min-h-28 w-full rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={summaryForm.text} onChange={(event) => setSummaryForm((prev) => ({ ...prev, text: event.target.value }))} placeholder="Paste note text" />
                <button
                  type="button"
                  onClick={() => runRequest("summarize", "/ai/summarize", {
                    subject: summaryForm.subject,
                    text: autoUseSelectedSource && selectedSource?.content ? selectedSource.content : summaryForm.text
                  }, setSummaryResult)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette.button}`}
                >
                  <Sparkles size={15} /> Summarize
                </button>
              </div>
            ) : null}

            {activeFeature === "quiz" ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={quizForm.subject} onChange={(event) => setQuizForm((prev) => ({ ...prev, subject: event.target.value }))} placeholder="Subject" />
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={quizForm.topic} onChange={(event) => setQuizForm((prev) => ({ ...prev, topic: event.target.value }))} placeholder="Topic" />
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={quizForm.difficulty} onChange={(event) => setQuizForm((prev) => ({ ...prev, difficulty: event.target.value }))} placeholder="Difficulty" />
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} type="number" min="1" max="10" value={quizForm.count} onChange={(event) => setQuizForm((prev) => ({ ...prev, count: Number(event.target.value || 1) }))} placeholder="Count" />
                <button
                  type="button"
                  onClick={() => runRequest("quiz", "/ai/quiz", {
                    ...quizForm,
                    sourceText: autoUseSelectedSource && selectedSource?.content ? selectedSource.content : ""
                  }, setQuizResult)}
                  className={`sm:col-span-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette.button}`}
                >
                  <Sparkles size={15} /> Generate Quiz
                </button>
              </div>
            ) : null}

            {activeFeature === "explain" ? (
              <div className="mt-4 space-y-2">
                <input className={`w-full rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={explainForm.topic} onChange={(event) => setExplainForm((prev) => ({ ...prev, topic: event.target.value }))} placeholder="Topic" />
                <textarea className={`min-h-20 w-full rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={explainForm.questionText} onChange={(event) => setExplainForm((prev) => ({ ...prev, questionText: event.target.value }))} placeholder="Question text" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={explainForm.selectedAnswer} onChange={(event) => setExplainForm((prev) => ({ ...prev, selectedAnswer: event.target.value }))} placeholder="Student answer" />
                  <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={explainForm.correctAnswer} onChange={(event) => setExplainForm((prev) => ({ ...prev, correctAnswer: event.target.value }))} placeholder="Correct answer" />
                </div>
                <button
                  type="button"
                  onClick={() => runRequest("explain", "/ai/explain", explainForm, setExplainResult)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette.button}`}
                >
                  <Sparkles size={15} /> Explain
                </button>
              </div>
            ) : null}

            {activeFeature === "recommend" ? (
              <div className="mt-4 space-y-2">
                <textarea className={`min-h-36 w-full rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={recommendForm.topicPerformance} onChange={(event) => setRecommendForm((prev) => ({ ...prev, topicPerformance: event.target.value }))} />
                <button
                  type="button"
                  onClick={() => {
                    let parsed = [];
                    try {
                      parsed = JSON.parse(recommendForm.topicPerformance);
                    } catch (_error) {
                      setError("topicPerformance must be valid JSON array");
                      return;
                    }
                    runRequest("recommend", "/ai/recommend", { topicPerformance: parsed }, setRecommendResult);
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette.button}`}
                >
                  <Sparkles size={15} /> Generate Actions
                </button>
              </div>
            ) : null}

            {activeFeature === "study-plan" ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={planForm.courseName} onChange={(event) => setPlanForm((prev) => ({ ...prev, courseName: event.target.value }))} placeholder="Course (optional)" />
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} type="number" min="1" value={planForm.hoursPerWeek} onChange={(event) => setPlanForm((prev) => ({ ...prev, hoursPerWeek: Number(event.target.value || 1) }))} placeholder="Hours per week" />
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} type="date" value={planForm.examDate} onChange={(event) => setPlanForm((prev) => ({ ...prev, examDate: event.target.value }))} />
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={planForm.preferredStudyTime} onChange={(event) => setPlanForm((prev) => ({ ...prev, preferredStudyTime: event.target.value }))} placeholder="Preferred study time" />
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={planForm.weakTopics} onChange={(event) => setPlanForm((prev) => ({ ...prev, weakTopics: event.target.value }))} placeholder="Weak topics override" />
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={planForm.completedChapters} onChange={(event) => setPlanForm((prev) => ({ ...prev, completedChapters: event.target.value }))} placeholder="Completed chapters override" />
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={planForm.quizScores} onChange={(event) => setPlanForm((prev) => ({ ...prev, quizScores: event.target.value }))} placeholder="Quiz scores e.g. 55,70,80" />
                <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={planForm.timeSpent} onChange={(event) => setPlanForm((prev) => ({ ...prev, timeSpent: event.target.value }))} placeholder="Study time override" />

                <label className={`sm:col-span-2 flex items-center gap-2 text-sm ${palette.text}`}>
                  <input type="checkbox" checked={planForm.autoFromAttempts} onChange={(event) => setPlanForm((prev) => ({ ...prev, autoFromAttempts: event.target.checked }))} />
                  Auto-fill from attempt history
                </label>

                <button
                  type="button"
                  onClick={() => runRequest("study-plan", "/ai/study-plan", {
                    courseName: planForm.courseName || selectedSource?.course || "",
                    hoursPerWeek: planForm.hoursPerWeek,
                    examDate: planForm.examDate,
                    completedChapters: splitCsv(planForm.completedChapters),
                    weakTopics: splitCsv(planForm.weakTopics),
                    quizScores: splitCsv(planForm.quizScores).map((item) => Number(item)).filter((num) => Number.isFinite(num)),
                    timeSpent: planForm.timeSpent,
                    autoFromAttempts: planForm.autoFromAttempts,
                    preferredStudyTime: planForm.preferredStudyTime
                  }, setPlanResult)}
                  className={`sm:col-span-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette.button}`}
                >
                  <Sparkles size={15} /> Build Weekly Plan
                </button>
              </div>
            ) : null}
          </article>

          {resultBlock}
        </div>
      </section>
    </section>
  );
}

export default AIAssistantPage;
