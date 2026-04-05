import { useEffect, useMemo, useState } from "react";
import { Bot, FileUp, LoaderCircle, Sparkles } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

GlobalWorkerOptions.workerSrc = pdfWorker;

function stripPdfExtension(name) {
  return String(name || "Uploaded PDF").replace(/\.pdf$/i, "").trim() || "Uploaded PDF";
}

async function extractPdfTextFromBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => (typeof item.str === "string" ? item.str : ""))
      .join(" ")
      .trim();

    if (text) {
      pages.push(text);
    }
  }

  return pages.join("\n\n").trim();
}

function normalizeSummaryInputText(text) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return "";
  }

  // Keep request payload manageable while preserving enough context for summarization.
  return normalized.slice(0, 60000);
}

function normalizeQuizInputText(text) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return "";
  }

  return normalized.slice(0, 30000);
}

function deriveQuizTopic(text, fallback) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return fallback;
  }

  const firstLine = normalized.split("\n").map((item) => item.trim()).find(Boolean);
  if (!firstLine) {
    return fallback;
  }

  return firstLine.slice(0, 80);
}

function deriveCompletedChapters(text = "") {
  return String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^chapter\s*\d+/i.test(line))
    .map((line) => line.replace(/^chapter\s*\d+\s*:\s*/i, "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function AIAssistantPage() {
  const { isDark } = useTheme();

  const [sourceMode, setSourceMode] = useState("course");
  const [resources, setResources] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [loadingResources, setLoadingResources] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizError, setQuizError] = useState("");
  const [planError, setPlanError] = useState("");
  const [summary, setSummary] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [activeOutput, setActiveOutput] = useState("");
  const [expandedPlanDay, setExpandedPlanDay] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);

  const palette = isDark
    ? {
        page: "text-slate-100",
        card: "bg-[#0d1427]",
        border: "border-white/10",
        meta: "text-slate-400",
        title: "text-white",
        input: "border-white/10 bg-white/5 text-slate-100",
        button: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20",
        danger: "text-rose-300"
      }
    : {
        page: "text-slate-900",
        card: "bg-white",
        border: "border-slate-200",
        meta: "text-slate-500",
        title: "text-slate-900",
        input: "border-slate-300 bg-white text-slate-700",
        button: "border-sky-300 bg-sky-100 text-sky-900 hover:bg-sky-200",
        danger: "text-rose-600"
      };

  useEffect(() => {
    let mounted = true;

    async function fetchResources() {
      if (!mounted) return;
      setLoadingResources(true);

      try {
        const response = await api.get("/resources");
        const items = Array.isArray(response.data) ? response.data : [];

        if (!mounted) return;

        setResources(items);
        setSelectedCourseId((current) => {
          if (items.length === 0) {
            return "";
          }

          const stillExists = items.some((item) => item._id === current);
          return stillExists ? current : items[0]._id;
        });
      } catch (_error) {
        if (mounted) {
          setResources([]);
        }
      } finally {
        if (mounted) {
          setLoadingResources(false);
        }
      }
    }

    fetchResources();
    const intervalId = setInterval(fetchResources, 15000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const selectedCourse = useMemo(
    () => resources.find((item) => item._id === selectedCourseId) || null,
    [resources, selectedCourseId]
  );

  function chooseSourceMode(mode) {
    setSourceMode(mode);
    setError("");

    if (mode === "course") {
      setUploadedFile(null);
      return;
    }

    setSelectedCourseId("");
  }

  async function resolveSource() {
    if (sourceMode === "device") {
      if (!uploadedFile) {
        throw new Error("Please upload a PDF file from your device.");
      }

      const text = await extractPdfTextFromBlob(uploadedFile);
      return {
        subject: stripPdfExtension(uploadedFile.name),
        text,
        sourceLabel: `Uploaded: ${uploadedFile.name}`
      };
    }

    if (selectedCourse?.fileUrl) {
      const response = await fetch(selectedCourse.fileUrl);
      if (!response.ok) {
        throw new Error("Could not access selected course PDF.");
      }

      const blob = await response.blob();
      const text = await extractPdfTextFromBlob(blob);
      return {
        subject: selectedCourse.course || selectedCourse.title || "Course",
        text,
        sourceLabel: `Course: ${selectedCourse.course || selectedCourse.title}`
      };
    }

    throw new Error("Please select one previously uploaded course.");
  }

  async function summarizeNote() {
    setActiveOutput("summary");
    setError("");
    setSummary(null);

    if (sourceMode === "device" && !uploadedFile) {
      setError("Please upload a PDF file from your device.");
      return;
    }

    if (sourceMode === "course" && !selectedCourse) {
      setError("Please select one previously uploaded course.");
      return;
    }

    setSummarizing(true);

    try {
      const source = await resolveSource();
      const summarizeText = normalizeSummaryInputText(source.text);

      if (!summarizeText) {
        throw new Error("The selected PDF has no readable text.");
      }

      const response = await api.post("/ai/summarize", {
        subject: source.subject,
        text: summarizeText
      });

      setSummary({
        sourceLabel: source.sourceLabel,
        subject: source.subject,
        ...response.data?.data
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to summarize note.");
    } finally {
      setSummarizing(false);
    }
  }

  async function generateQuizFromMaterial() {
    setActiveOutput("quiz");
    setQuizError("");
    setQuizQuestions([]);
    setQuizIndex(0);
    setSelectedAnswer("");
    setIsAnswered(false);

    if (sourceMode === "device" && !uploadedFile) {
      setQuizError("Please upload a PDF file from your device.");
      return;
    }

    if (sourceMode === "course" && !selectedCourse) {
      setQuizError("Please select one previously uploaded course.");
      return;
    }

    setQuizLoading(true);

    try {
      const source = await resolveSource();
      const quizSourceText = normalizeQuizInputText(source.text);

      if (!quizSourceText) {
        throw new Error("The selected PDF has no readable text for quiz generation.");
      }

      const response = await api.post("/ai/quiz", {
        subject: source.subject,
        topic: deriveQuizTopic(quizSourceText, source.subject),
        difficulty: "medium",
        count: 5,
        sourceText: quizSourceText
      });

      const questions = Array.isArray(response.data?.data?.questions) ? response.data.data.questions : [];
      if (!questions.length) {
        throw new Error("No quiz questions were generated from this material.");
      }

      setQuizQuestions(questions);
    } catch (err) {
      setQuizError(err?.response?.data?.message || err?.message || "Failed to generate quiz.");
    } finally {
      setQuizLoading(false);
    }
  }

  async function generateWeeklyPlanFromMaterial() {
    setActiveOutput("plan");
    setPlanError("");
    setWeeklyPlan(null);

    if (sourceMode === "device" && !uploadedFile) {
      setPlanError("Please upload a PDF file from your device.");
      return;
    }

    if (sourceMode === "course" && !selectedCourse) {
      setPlanError("Please select one previously uploaded course.");
      return;
    }

    setPlanLoading(true);

    try {
      const source = await resolveSource();
      const sourceText = normalizeSummaryInputText(source.text);

      if (!sourceText) {
        throw new Error("The selected PDF has no readable text for plan generation.");
      }

      const completedChapters = deriveCompletedChapters(sourceText);

      const response = await api.post("/ai/study-plan", {
        courseName: source.subject,
        hoursPerWeek: 10,
        preferredStudyTime: "evening",
        autoFromAttempts: true,
        completedChapters
      });

      const planData = response.data?.data || null;
      if (!planData) {
        throw new Error("No weekly plan returned.");
      }

      setWeeklyPlan({
        sourceLabel: source.sourceLabel,
        subject: source.subject,
        ...planData
      });
      setExpandedPlanDay(null);
    } catch (err) {
      setPlanError(err?.response?.data?.message || err?.message || "Failed to generate weekly plan.");
    } finally {
      setPlanLoading(false);
    }
  }

  function selectQuizAnswer(option) {
    if (isAnswered) {
      return;
    }

    setSelectedAnswer(option);
    setIsAnswered(true);
  }

  function nextQuestion() {
    if (quizIndex >= quizQuestions.length - 1) {
      return;
    }

    setQuizIndex((current) => current + 1);
    setSelectedAnswer("");
    setIsAnswered(false);
  }

  const currentQuestion = quizQuestions[quizIndex] || null;
  const isLastQuestion = quizIndex === quizQuestions.length - 1;

  return (
    <section className={`space-y-6 ${palette.page}`}>
      <header className={`rounded-[26px] border p-5 sm:p-6 ${palette.card} ${palette.border}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            
            <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${palette.meta}`}>AI Hub</p>
            <h1 className={`mt-2 typo-page-title ${palette.title}`}>Smart PDF Note Summarizer</h1>
            <p className={`mt-2 max-w-3xl typo-page-subtitle ${palette.meta}`}>
              Choose any previously uploaded course PDF or upload a new one, then generate a clean AI summary.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${palette.border}`}>
            <Bot size={14} />
            Modern AI workflow
          </div>
        </div>
      </header>

      <article className={`rounded-[26px] border p-5 sm:p-6 ${palette.card} ${palette.border}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Choose One Source</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseSourceMode("course")}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${sourceMode === "course" ? palette.button : palette.input}`}
          >
            Use Previous Uploaded Course
          </button>
          <button
            type="button"
            onClick={() => chooseSourceMode("device")}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${sourceMode === "device" ? palette.button : palette.input}`}
          >
            Upload PDF From Device
          </button>
        </div>

        {sourceMode === "course" ? (
          <div className="mt-3">
            <select
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              disabled={loadingResources || resources.length === 0}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${palette.input}`}
            >
              {loadingResources ? <option value="">Loading uploaded courses...</option> : null}
              {!loadingResources && resources.length === 0 ? <option value="">No uploaded courses found</option> : null}
              {resources.map((resource) => (
                <option key={resource._id} value={resource._id}>
                  {resource.course} - {resource.title}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {sourceMode === "device" ? (
          <div className="mt-3">
            <label className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${palette.input}`}>
              <FileUp size={16} />
              <span className="truncate">{uploadedFile ? uploadedFile.name : "Choose PDF from your device"}</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setUploadedFile(event.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>
        ) : null}

        <p className={`mt-2 text-xs ${palette.meta}`}>
          {sourceMode === "course"
            ? "Mode selected: previous uploaded course."
            : "Mode selected: upload from your device."}
        </p>

        <button
          type="button"
          onClick={summarizeNote}
          disabled={summarizing}
          className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${palette.button}`}
        >
          {summarizing ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {summarizing ? "Summarizing..." : "Summarize Note"}
        </button>

        <button
          type="button"
          onClick={generateQuizFromMaterial}
          disabled={quizLoading}
          className={`ml-2 mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${palette.button}`}
        >
          {quizLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {quizLoading ? "Generating Quiz..." : "Generate Quiz"}
        </button>

        <button
          type="button"
          onClick={generateWeeklyPlanFromMaterial}
          disabled={planLoading}
          className={`ml-2 mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${palette.button}`}
        >
          {planLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {planLoading ? "Building Plan..." : "Build Plan"}
        </button>

        {error ? <p className={`mt-4 text-sm ${palette.danger}`}>{error}</p> : null}
        {quizError ? <p className={`mt-2 text-sm ${palette.danger}`}>{quizError}</p> : null}
        {planError ? <p className={`mt-2 text-sm ${palette.danger}`}>{planError}</p> : null}
      </article>

      {activeOutput === "summary" && summary ? (
        <article className={`rounded-[26px] border p-5 sm:p-6 ${palette.card} ${palette.border}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${palette.meta}`}>Summary Output</p>
          <p className={`mt-1 text-xs ${palette.meta}`}>{summary.sourceLabel}</p>
          <h2 className={`mt-2 typo-section-title ${palette.title}`}>{summary.subject}</h2>

          <section className="mt-4 space-y-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Short Summary</p>
              <p className={`mt-2 typo-body-relaxed ${palette.page}`}>{summary.shortSummary || "No summary text returned."}</p>
            </div>

            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Detailed Summary</p>
              <p className={`mt-2 typo-body-relaxed ${palette.page}`}>
                {summary.detailedSummary || "No detailed summary returned."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Key Points</p>
                <ul className={`mt-2 space-y-1 text-sm ${palette.page}`}>
                  {(Array.isArray(summary.keyPoints) ? summary.keyPoints : []).map((item, index) => (
                    <li key={`kp-${index}`}>- {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Exam Tips</p>
                <ul className={`mt-2 space-y-1 text-sm ${palette.page}`}>
                  {(Array.isArray(summary.examTips) ? summary.examTips : []).map((item, index) => (
                    <li key={`tip-${index}`}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Core Concepts</p>
                <ul className={`mt-2 space-y-1 text-sm ${palette.page}`}>
                  {(Array.isArray(summary.coreConcepts) ? summary.coreConcepts : []).map((item, index) => (
                    <li key={`concept-${index}`}>- {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Worked Examples</p>
                <ul className={`mt-2 space-y-1 text-sm ${palette.page}`}>
                  {(Array.isArray(summary.workedExamples) ? summary.workedExamples : []).map((item, index) => (
                    <li key={`example-${index}`}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Common Mistakes</p>
                <ul className={`mt-2 space-y-1 text-sm ${palette.page}`}>
                  {(Array.isArray(summary.commonMistakes) ? summary.commonMistakes : []).map((item, index) => (
                    <li key={`mistake-${index}`}>- {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Quick Practice Tasks</p>
                <ul className={`mt-2 space-y-1 text-sm ${palette.page}`}>
                  {(Array.isArray(summary.quickPractice) ? summary.quickPractice : []).map((item, index) => (
                    <li key={`practice-${index}`}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </article>
      ) : null}

      {activeOutput === "plan" && weeklyPlan ? (
        <article className={`rounded-[26px] border p-5 sm:p-6 ${palette.card} ${palette.border}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${palette.meta}`}>Weekly Plan</p>
          <p className={`mt-1 text-xs ${palette.meta}`}>{weeklyPlan.sourceLabel}</p>
          <h2 className={`mt-2 typo-section-title ${palette.title}`}>{weeklyPlan.subject}</h2>
          <p className={`mt-3 typo-body-relaxed ${palette.page}`}>{weeklyPlan.explanation || "No plan explanation available."}</p>

          {Array.isArray(weeklyPlan.focusAreas) && weeklyPlan.focusAreas.length ? (
            <div className="mt-4">
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Focus Areas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {weeklyPlan.focusAreas.map((area, index) => (
                  <span key={`focus-${index}`} className={`rounded-full border px-2.5 py-1 text-xs ${palette.input}`}>
                    {area}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(Array.isArray(weeklyPlan.weeklySchedule) ? weeklyPlan.weeklySchedule : []).map((dayItem, index) => (
              <article key={`${dayItem.day || "day"}-${index}`} className={`rounded-xl border p-4 ${palette.input}`}>
                <button
                  type="button"
                  onClick={() => setExpandedPlanDay((current) => (current === index ? null : index))}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className={`typo-body font-semibold ${palette.title}`}>{dayItem.day || `Day ${index + 1}`}</p>
                    <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.14em] ${palette.meta}`}>
                      {dayItem.focus || "Study"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${palette.meta}`}>{Math.round(Number(dayItem.durationMinutes || 0))} min</p>
                    <p className={`mt-1 text-xs ${palette.meta}`}>{expandedPlanDay === index ? "Hide details" : "View details"}</p>
                  </div>
                </button>

                {expandedPlanDay === index ? (
                  <ul className={`mt-3 space-y-1 text-sm ${palette.page}`}>
                    {(Array.isArray(dayItem.tasks) ? dayItem.tasks : []).map((task, taskIndex) => (
                      <li key={`${index}-task-${taskIndex}`}>- {task}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>

          {Array.isArray(weeklyPlan.specificActions) && weeklyPlan.specificActions.length ? (
            <div className="mt-4">
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.meta}`}>Specific Actions</p>
              <ul className={`mt-2 space-y-1 text-sm ${palette.page}`}>
                {weeklyPlan.specificActions.map((item, index) => (
                  <li key={`action-${index}`}>- {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ) : null}

      {activeOutput === "quiz" && currentQuestion ? (
        <article className={`rounded-[26px] border p-5 sm:p-6 ${palette.card} ${palette.border}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${palette.meta}`}>Quiz</p>
          <p className={`mt-1 text-xs ${palette.meta}`}>Question {quizIndex + 1} of {quizQuestions.length}</p>
          <h2 className={`mt-3 typo-section-title ${palette.title}`}>{currentQuestion.questionText}</h2>

          <div className="mt-4 space-y-2">
            {(Array.isArray(currentQuestion.options) ? currentQuestion.options : []).map((option, index) => {
              const isCorrectOption = option === currentQuestion.correctAnswer;
              const isSelectedOption = option === selectedAnswer;

              let optionClasses = palette.input;
              if (isAnswered && isCorrectOption) {
                optionClasses = "border-emerald-500 bg-emerald-100 text-emerald-900";
              } else if (isAnswered && isSelectedOption && !isCorrectOption) {
                optionClasses = "border-rose-500 bg-rose-100 text-rose-900";
              }

              return (
                <button
                  key={`${index}-${option}`}
                  type="button"
                  onClick={() => selectQuizAnswer(option)}
                  disabled={isAnswered}
                  className={`block w-full rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed ${optionClasses}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {isAnswered ? (
            <div className="mt-4">
              <p className={`text-sm ${selectedAnswer === currentQuestion.correctAnswer ? "text-emerald-600" : palette.danger}`}>
                {selectedAnswer === currentQuestion.correctAnswer ? "Correct answer." : "Incorrect answer."}
              </p>
              {!isLastQuestion ? (
                <button
                  type="button"
                  onClick={nextQuestion}
                  className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${palette.button}`}
                >
                  Next
                </button>
              ) : (
                <p className={`mt-3 text-sm ${palette.meta}`}>Quiz complete. Generate again to start a new quiz.</p>
              )}
            </div>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}

export default AIAssistantPage;
