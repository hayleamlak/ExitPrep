import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

function OutputCard({ title, data, palette }) {
  return (
    <article className={`rounded-2xl border p-4 ${palette.card} ${palette.border}`}>
      <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>{title}</h3>
      <pre className={`mt-3 overflow-x-auto whitespace-pre-wrap text-sm ${palette.text}`}>{JSON.stringify(data, null, 2)}</pre>
    </article>
  );
}

function AIAssistantPage() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

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
    topicPerformance: JSON.stringify([
      { topic: "Inheritance", accuracy: 48 },
      { topic: "Encapsulation", accuracy: 62 },
      { topic: "Polymorphism", accuracy: 39 }
    ], null, 2)
  });
  const [planForm, setPlanForm] = useState({
    hoursPerWeek: 10,
    examDate: "",
    weakTopics: "Inheritance, Polymorphism",
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
        card: "bg-[#0d1427]",
        border: "border-white/10",
        meta: "text-slate-400",
        text: "text-slate-200",
        input: "border-white/10 bg-white/5 text-slate-100",
        button: "border-white/20 bg-white/10 text-slate-100 hover:bg-white/20",
        danger: "text-rose-300"
      }
    : {
        page: "text-slate-900",
        card: "bg-white",
        border: "border-slate-200",
        meta: "text-slate-500",
        text: "text-slate-700",
        input: "border-slate-300 bg-white text-slate-700",
        button: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
        danger: "text-rose-600"
      };

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

  return (
    <section className={`space-y-6 ${palette.page}`}>
      <header className="rounded-2xl border border-sky-300/30 bg-sky-100/40 p-4">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-sky-600" />
          <h1 className="text-2xl font-bold">AI Assistant Lab</h1>
        </div>
        <p className={`mt-2 text-sm ${palette.meta}`}>
          Run all ExitPrep AI features from one page: summarize notes, generate quiz, explain answers, recommend weak-topic actions, and build a study plan.
        </p>
      </header>

      {error ? <p className={`rounded-xl border px-3 py-2 text-sm ${palette.danger} ${palette.card} ${palette.border}`}>{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <article className={`rounded-2xl border p-4 ${palette.card} ${palette.border}`}>
          <h2 className="font-semibold">1) PDF/Notes Summarization</h2>
          <input
            className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm ${palette.input}`}
            value={summaryForm.subject}
            onChange={(event) => setSummaryForm((prev) => ({ ...prev, subject: event.target.value }))}
            placeholder="Subject"
          />
          <textarea
            className={`mt-3 min-h-24 w-full rounded-lg border px-3 py-2 text-sm ${palette.input}`}
            value={summaryForm.text}
            onChange={(event) => setSummaryForm((prev) => ({ ...prev, text: event.target.value }))}
            placeholder="Paste PDF text or notes"
          />
          <button
            type="button"
            onClick={() => runRequest("summarize", "/ai/summarize", summaryForm, setSummaryResult)}
            className={`mt-3 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette.button}`}
          >
            {loading === "summarize" ? "Summarizing..." : "Summarize with AI"}
          </button>
        </article>

        <article className={`rounded-2xl border p-4 ${palette.card} ${palette.border}`}>
          <h2 className="font-semibold">2) AI Quiz Generation</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={quizForm.subject} onChange={(event) => setQuizForm((prev) => ({ ...prev, subject: event.target.value }))} placeholder="Subject" />
            <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={quizForm.topic} onChange={(event) => setQuizForm((prev) => ({ ...prev, topic: event.target.value }))} placeholder="Topic" />
            <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={quizForm.difficulty} onChange={(event) => setQuizForm((prev) => ({ ...prev, difficulty: event.target.value }))} placeholder="Difficulty" />
            <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} type="number" min="1" max="10" value={quizForm.count} onChange={(event) => setQuizForm((prev) => ({ ...prev, count: Number(event.target.value || 1) }))} placeholder="Count" />
          </div>
          <button
            type="button"
            onClick={() => runRequest("quiz", "/ai/quiz", quizForm, setQuizResult)}
            className={`mt-3 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette.button}`}
          >
            {loading === "quiz" ? "Generating..." : "Generate Quiz"}
          </button>
        </article>

        <article className={`rounded-2xl border p-4 ${palette.card} ${palette.border}`}>
          <h2 className="font-semibold">3) Answer Explanation</h2>
          <div className="mt-3 grid gap-2">
            <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={explainForm.topic} onChange={(event) => setExplainForm((prev) => ({ ...prev, topic: event.target.value }))} placeholder="Topic" />
            <textarea className={`min-h-20 rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={explainForm.questionText} onChange={(event) => setExplainForm((prev) => ({ ...prev, questionText: event.target.value }))} placeholder="Question text" />
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={explainForm.selectedAnswer} onChange={(event) => setExplainForm((prev) => ({ ...prev, selectedAnswer: event.target.value }))} placeholder="Student answer" />
              <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={explainForm.correctAnswer} onChange={(event) => setExplainForm((prev) => ({ ...prev, correctAnswer: event.target.value }))} placeholder="Correct answer" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => runRequest("explain", "/ai/explain", explainForm, setExplainResult)}
            className={`mt-3 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette.button}`}
          >
            {loading === "explain" ? "Explaining..." : "Explain Answer"}
          </button>
        </article>

        <article className={`rounded-2xl border p-4 ${palette.card} ${palette.border}`}>
          <h2 className="font-semibold">4) Weak-topic Recommendations</h2>
          <textarea
            className={`mt-3 min-h-28 w-full rounded-lg border px-3 py-2 text-sm ${palette.input}`}
            value={recommendForm.topicPerformance}
            onChange={(event) => setRecommendForm((prev) => ({ ...prev, topicPerformance: event.target.value }))}
          />
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
            className={`mt-3 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette.button}`}
          >
            {loading === "recommend" ? "Generating..." : "Generate Recommendations"}
          </button>
        </article>

        <article className={`rounded-2xl border p-4 ${palette.card} ${palette.border} xl:col-span-2`}>
          <h2 className="font-semibold">5) Study Plan Generator</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} type="number" min="1" value={planForm.hoursPerWeek} onChange={(event) => setPlanForm((prev) => ({ ...prev, hoursPerWeek: Number(event.target.value || 1) }))} placeholder="Hours per week" />
            <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} type="date" value={planForm.examDate} onChange={(event) => setPlanForm((prev) => ({ ...prev, examDate: event.target.value }))} />
            <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={planForm.weakTopics} onChange={(event) => setPlanForm((prev) => ({ ...prev, weakTopics: event.target.value }))} placeholder="Weak topics comma-separated" />
            <input className={`rounded-lg border px-3 py-2 text-sm ${palette.input}`} value={planForm.preferredStudyTime} onChange={(event) => setPlanForm((prev) => ({ ...prev, preferredStudyTime: event.target.value }))} placeholder="Preferred time" />
          </div>
          <button
            type="button"
            onClick={() => runRequest("study-plan", "/ai/study-plan", {
              hoursPerWeek: planForm.hoursPerWeek,
              examDate: planForm.examDate,
              weakTopics: planForm.weakTopics.split(",").map((item) => item.trim()).filter(Boolean),
              preferredStudyTime: planForm.preferredStudyTime
            }, setPlanResult)}
            className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${palette.button}`}
          >
            <Sparkles size={15} />
            {loading === "study-plan" ? "Generating..." : "Generate Study Plan"}
          </button>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {summaryResult ? <OutputCard title="Summary Output" data={summaryResult} palette={palette} /> : null}
        {quizResult ? <OutputCard title="Quiz Output" data={quizResult} palette={palette} /> : null}
        {explainResult ? <OutputCard title="Explanation Output" data={explainResult} palette={palette} /> : null}
        {recommendResult ? <OutputCard title="Recommendations Output" data={recommendResult} palette={palette} /> : null}
        {planResult ? <OutputCard title="Study Plan Output" data={planResult} palette={palette} /> : null}
      </div>
    </section>
  );
}

export default AIAssistantPage;
