import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Circle, Search, Share2 } from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function sentenceCase(value) {
  if (!value || typeof value !== "string") {
    return "General";
  }

  const normalized = value.trim();
  if (!normalized) return "General";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function createDescription(subject, mode, year) {
  const yearSuffix = year ? ` (${year})` : "";

  if (mode === "past") {
    return `Past EUEE quiz set for ${subject.toLowerCase()}${yearSuffix}.`;
  }

  if (mode === "custom") {
    return `Custom department questions for ${subject.toLowerCase()}.`;
  }

  return `EUEE simulation questions for ${subject.toLowerCase()} to improve exam readiness.`;
}

const modeCards = [
  {
    id: "simulation",
    badge: "FULL SIMULATION",
    title: "EUEE Simulation",
    description: "Generate simulation tests distributed across EUEE core subjects.",
    cta: "Start Simulation"
  },
  {
    id: "past",
    badge: "OFFICIAL EXAMS",
    title: "Past Exam",
    description: "Practice from archived Ethiopian University Exit Exam question sets.",
    cta: "Explore Archives"
  },
  {
    id: "custom",
    badge: "CUSTOM QUESTION",
    title: "Department Questions",
    description: "Choose your department and start custom quiz sets by subject.",
    cta: "Choose Department"
  }
];

function sanitizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.filter((option) => typeof option === "string" && option.trim().length > 0);
}

function normalizeQuestion(item, index) {
  const options = sanitizeOptions(item?.options);
  const rawCorrectAnswer = typeof item?.correctAnswer === "string" ? item.correctAnswer.trim() : "";
  const subject = sentenceCase(item?.subject || item?.courseName || "General");
  const topic = typeof item?.topic === "string" && item.topic.trim() ? item.topic.trim() : subject;

  return {
    id: item?._id || `${(item?.subject || "general").toLowerCase()}-${index}`,
    questionText: item?.questionText || "",
    options,
    correctAnswer: rawCorrectAnswer,
    explanation: typeof item?.explanation === "string" ? item.explanation : "",
    subject,
    topic,
    category: typeof item?.category === "string" ? item.category : typeof item?.sourceType === "string" ? item.sourceType : "custom",
    sourceType: typeof item?.sourceType === "string" ? item.sourceType : "custom",
    examYear: Number.isFinite(Number(item?.examYear)) ? Number(item.examYear) : null
  };
}

function PracticeQuestionsPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizMode, setQuizMode] = useState("");
  const [activeTopicId, setActiveTopicId] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [topicProgress, setTopicProgress] = useState({});
  const [simulationDurationMinutes, setSimulationDurationMinutes] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const palette = isDark
    ? {
        title: "text-white",
        description: "text-slate-400",
        divider: "border-white/10",
        searchInput:
          "border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-500 focus:border-white/25",
        listWrap: "border-white/10 bg-[#0d1326]",
        rowDivider: "border-white/10",
        dotInactive: "bg-slate-600",
        dotActive: "bg-blue-500",
        topicTitle: "text-slate-50",
        topicDescription: "text-slate-400",
        shareButton:
          "border-white/10 bg-white/5 text-slate-300 group-hover:border-white/20 group-hover:bg-white/10",
        ratio: "text-slate-400",
        arrowButton: "border-white/10 text-slate-500",
        emptyText: "text-slate-500",
        error: "border-rose-400/30 bg-rose-400/10 text-rose-200",
        quizCard: "border-white/10 bg-[#0d1326]",
        quizButton: "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10",
        quizSecondaryButton: "border-white/10 text-slate-300 hover:bg-white/5",
        optionButton: "border-white/10 bg-white/5 text-slate-200 hover:border-white/20",
        optionSelected: "border-blue-400/80 bg-blue-500/20 text-white",
        optionCorrect: "border-emerald-400/80 bg-emerald-500/20 text-emerald-100",
        optionWrong: "border-rose-400/80 bg-rose-500/20 text-rose-100",
        successText: "text-emerald-300",
        wrongText: "text-rose-300"
      }
    : {
        title: "text-slate-900",
        description: "text-slate-600",
        divider: "border-slate-200",
        searchInput:
          "border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-slate-500",
        listWrap: "border-slate-200 bg-white",
        rowDivider: "border-slate-200",
        dotInactive: "bg-slate-300",
        dotActive: "bg-sky-500",
        topicTitle: "text-slate-900",
        topicDescription: "text-slate-500",
        shareButton:
          "border-slate-300 bg-slate-50 text-slate-600 group-hover:border-slate-400 group-hover:bg-slate-100",
        ratio: "text-slate-600",
        arrowButton: "border-slate-300 text-slate-500",
        emptyText: "text-slate-500",
        error: "border-rose-300 bg-rose-50 text-rose-700",
        quizCard: "border-slate-200 bg-white",
        quizButton: "border-slate-300 bg-slate-900 text-white hover:bg-slate-700",
        quizSecondaryButton: "border-slate-300 text-slate-700 hover:bg-slate-50",
        optionButton: "border-slate-300 bg-white text-slate-800 hover:border-slate-500",
        optionSelected: "border-sky-500 bg-sky-50 text-sky-800",
        optionCorrect: "border-emerald-500 bg-emerald-50 text-emerald-800",
        optionWrong: "border-rose-500 bg-rose-50 text-rose-700",
        successText: "text-emerald-700",
        wrongText: "text-rose-700"
      };

  const activeTopic = useMemo(
    () => topics.find((topic) => topic.id === activeTopicId) || null,
    [topics, activeTopicId]
  );

  const activeQuestion = activeTopic?.questions?.[currentQuestionIndex] || null;
  const selectedAnswer = activeQuestion ? selectedAnswers[activeQuestion.id] : "";
  const hasAnsweredCurrentQuestion = Boolean(selectedAnswer);
  const isCurrentQuestionRevealed = activeQuestion ? Boolean(revealedAnswers[activeQuestion.id]) : false;

  useEffect(() => {
    const loadQuestions = async () => {
      if (!quizMode) {
        setTopics([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = { category: quizMode };
        const response = await api.get("/questions", { params });
        const questions = Array.isArray(response.data) ? response.data : [];

        const grouped = questions.reduce((acc, item, index) => {
          const subject = sentenceCase(item?.subject || item?.courseName || "General");
          const year = Number.isFinite(Number(item?.examYear)) ? Number(item.examYear) : null;
          const key = subject.toLowerCase();
          const normalizedQuestion = normalizeQuestion(item, index);

          const hasValidCorrectAnswer = normalizedQuestion.options.includes(normalizedQuestion.correctAnswer);

          if (
            !normalizedQuestion.questionText ||
            normalizedQuestion.options.length < 2 ||
            !hasValidCorrectAnswer
          ) {
            return acc;
          }

          if (!acc[key]) {
            acc[key] = {
              id: key,
              title: subject,
              description: createDescription(subject, quizMode, year),
              completed: 0,
              total: 0,
              questions: []
            };
          }

          acc[key].total += 1;
          acc[key].questions.push(normalizedQuestion);
          return acc;
        }, {});

        const groupedTopics = Object.values(grouped).sort((a, b) => a.title.localeCompare(b.title));

        if (quizMode === "simulation" && questions.length > 0) {
          const allQuestions = groupedTopics.flatMap((topic) => topic.questions);
          groupedTopics.unshift({
            id: "full-euee-simulation",
            title: "EUEE Full Simulation",
            description: "Mixed simulation across all available EUEE subjects.",
            completed: 0,
            total: allQuestions.length,
            questions: allQuestions
          });
        }

        setTopics(groupedTopics);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load questions.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [quizMode]);

  useEffect(() => {
    setActiveTopicId("");
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setRevealedAnswers({});
    setIsSubmitted(false);
    setRemainingSeconds(0);
    setIsTimeUp(false);
    setSearch("");
  }, [quizMode]);

  useEffect(() => {
    if (quizMode !== "simulation" || !activeTopic || isSubmitted || remainingSeconds <= 0) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [quizMode, activeTopic, isSubmitted, remainingSeconds]);

  useEffect(() => {
    if (quizMode !== "simulation" || !activeTopic || isSubmitted || remainingSeconds !== 0) {
      return;
    }

    setIsTimeUp(true);
    setIsSubmitted(true);
    setRevealedAnswers(
      activeTopic.questions.reduce((acc, question) => {
        acc[question.id] = true;
        return acc;
      }, {})
    );
    setTopicProgress((previous) => ({
      ...previous,
      [activeTopic.id]: activeTopic.total
    }));

    const answeredAttempts = activeTopic.questions
      .filter((question) => Boolean(selectedAnswers[question.id]))
      .map((question) => ({
        course: question.subject || activeTopic.title,
        topic: question.topic || question.subject || activeTopic.title,
        isCorrect: selectedAnswers[question.id] === question.correctAnswer
      }));

    if (!answeredAttempts.length) {
      return;
    }

    api.post("/attempts/bulk", { attempts: answeredAttempts }).catch(() => {
      // Keep the quiz usable even if analytics tracking fails.
    });
  }, [quizMode, activeTopic, isSubmitted, remainingSeconds, selectedAnswers]);

  const filteredTopics = useMemo(() => {
    const term = search.toLowerCase();
    return topics.filter(
      (topic) => topic.title.toLowerCase().includes(term) || topic.description.toLowerCase().includes(term)
    );
  }, [search, topics]);

  const score = useMemo(() => {
    if (!activeTopic) {
      return 0;
    }

    return activeTopic.questions.reduce((total, question) => {
      return selectedAnswers[question.id] === question.correctAnswer ? total + 1 : total;
    }, 0);
  }, [activeTopic, selectedAnswers]);

  const answeredCount = activeTopic
    ? activeTopic.questions.filter((question) => Boolean(selectedAnswers[question.id])).length
    : 0;

  const handleStartQuiz = (topicId) => {
    setActiveTopicId(topicId);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setRevealedAnswers({});
    setIsSubmitted(false);
    setIsTimeUp(false);
    setRemainingSeconds(quizMode === "simulation" ? simulationDurationMinutes * 60 : 0);
  };

  const handleBackToTopics = () => {
    setActiveTopicId("");
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setRevealedAnswers({});
    setIsSubmitted(false);
    setRemainingSeconds(0);
    setIsTimeUp(false);
  };

  const handleSelectAnswer = (answer) => {
    if (!activeQuestion || isSubmitted || isCurrentQuestionRevealed) {
      return;
    }

    setSelectedAnswers((previous) => ({
      ...previous,
      [activeQuestion.id]: answer
    }));
    setRevealedAnswers((previous) => ({
      ...previous,
      [activeQuestion.id]: true
    }));
  };

  const handleSubmitQuiz = () => {
    if (!activeTopic || isSubmitted) {
      return;
    }

    setIsSubmitted(true);
    setRevealedAnswers(
      activeTopic.questions.reduce((acc, question) => {
        acc[question.id] = true;
        return acc;
      }, {})
    );
    setTopicProgress((previous) => ({
      ...previous,
      [activeTopic.id]: activeTopic.total
    }));

    const answeredAttempts = activeTopic.questions
      .filter((question) => Boolean(selectedAnswers[question.id]))
      .map((question) => ({
        course: question.subject || activeTopic.title,
        topic: question.topic || question.subject || activeTopic.title,
        isCorrect: selectedAnswers[question.id] === question.correctAnswer
      }));

    if (!answeredAttempts.length) {
      return;
    }

    api.post("/attempts/bulk", { attempts: answeredAttempts }).catch(() => {
      // Keep the quiz usable even if analytics tracking fails.
    });
  };

  const handleNext = () => {
    if (!activeTopic || !activeQuestion) {
      return;
    }

    setRevealedAnswers((previous) => ({
      ...previous,
      [activeQuestion.id]: true
    }));

    setCurrentQuestionIndex((previous) => Math.min(previous + 1, activeTopic.questions.length - 1));
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((previous) => Math.max(previous - 1, 0));
  };

  return (
    <section className="space-y-6">
      <div className={`flex flex-wrap items-start justify-between gap-4 border-b pb-6 ${palette.divider}`}>
        <div>
          <h1 className={`typo-page-title ${palette.title}`}>EUEE Assessments</h1>
          <p className={`mt-1 typo-page-subtitle ${palette.description}`}>
            First choose EUEE Simulation, Past Exam, or Custom Questions by department.
          </p>
        </div>

        {quizMode ? (
          <div className="flex w-full max-w-xs flex-col gap-2">
            <button
              type="button"
              onClick={() => setQuizMode("")}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${palette.shareButton}`}
            >
              Change mode
            </button>

            <label className="relative block w-full">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={quizMode === "custom" ? "Search department..." : "Search..."}
                className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${palette.searchInput}`}
              />
            </label>
          </div>
        ) : null}
      </div>

      {!quizMode ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modeCards.map((card) => (
            <article key={card.id} className={`rounded-3xl border p-5 sm:p-6 ${palette.listWrap}`}>
              <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.2em] ${palette.shareButton}`}>
                {card.badge}
              </div>
              <h2 className={`mt-5 typo-section-title ${palette.title}`}>{card.title}</h2>
              <p className={`mt-3 typo-body-relaxed ${palette.description}`}>{card.description}</p>
              <button
                type="button"
                onClick={() => setQuizMode(card.id)}
                className="mt-6 rounded-2xl border border-slate-900 bg-slate-900 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-white"
              >
                {card.cta}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {quizMode && loading ? <p className={`text-sm ${palette.emptyText}`}>Loading questions...</p> : null}
      {error ? <p className={`rounded-xl border px-3 py-2 text-sm ${palette.error}`}>{error}</p> : null}
      {quizMode && !loading && !error && !topics.length ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${palette.error}`}>
          {quizMode === "past"
            ? "No past EUEE quiz questions found. Import questions with sourceType set to past."
            : quizMode === "custom"
              ? "No custom department questions found. Import questions with sourceType set to custom."
              : "No simulation questions found yet. Import questions with sourceType set to simulation."}
        </p>
      ) : null}

      {quizMode && !loading && !error && !activeTopic ? (
        <div className={`overflow-hidden rounded-2xl border ${palette.listWrap}`}>
          {quizMode === "simulation" ? (
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 ${palette.rowDivider}`}>
              <div>
                <p className={`text-sm font-semibold ${palette.title}`}>Simulation duration</p>
                <p className={`text-xs ${palette.description}`}>Set the quiz time before you start.</p>
              </div>
              <select
                value={simulationDurationMinutes}
                onChange={(event) => setSimulationDurationMinutes(Number(event.target.value))}
                className={`rounded-xl border px-3 py-2 text-sm outline-none ${palette.searchInput}`}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          ) : null}
          {filteredTopics.map((topic, index) => (
            <div
              key={topic.id}
              className={`group flex flex-wrap items-center gap-3 border-b px-4 py-4 last:border-b-0 sm:px-5 sm:py-5 ${palette.rowDivider}`}
            >
              <div
                className={[
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  index === 0 ? palette.dotActive : palette.dotInactive
                ].join(" ")}
              />

              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <p className={`truncate typo-row-title ${palette.topicTitle}`}>{topic.title}</p>
                <p className={`mt-1 truncate typo-body ${palette.topicDescription}`}>{topic.description}</p>
              </div>

              <button
                type="button"
                className={`grid h-9 w-9 place-items-center rounded-xl border transition sm:h-10 sm:w-10 ${palette.shareButton}`}
                title={`Share ${topic.title}`}
              >
                <Share2 size={16} />
              </button>

              <p className={`w-16 text-center typo-body sm:w-20 ${palette.ratio}`}>
                {topicProgress[topic.id] || topic.completed}/{topic.total}
              </p>

              <button
                type="button"
                className={`rounded-full border p-2 ${palette.arrowButton}`}
                title={`Start ${topic.title} quiz`}
                onClick={() => handleStartQuiz(topic.id)}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          ))}

          {!filteredTopics.length ? (
            <div className="flex items-center gap-2 px-5 py-8">
              <Circle size={8} className={palette.emptyText} />
              <p className={`text-sm ${palette.emptyText}`}>No questions matched your search.</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && !error && activeTopic && activeQuestion ? (
        <div className={`rounded-2xl border p-4 sm:p-6 ${palette.quizCard}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4 sm:mb-5 sm:pb-5">
            <div>
              <p className={`text-sm ${palette.description}`}>{activeTopic.title} Quiz</p>
              <h2 className={`typo-section-title ${palette.title}`}>
                Question {currentQuestionIndex + 1} of {activeTopic.questions.length}
              </h2>
            </div>

            {quizMode === "simulation" ? (
              <p className={`rounded-full border px-3 py-1 text-sm font-semibold ${palette.shareButton}`}>
                Time left: {formatDuration(remainingSeconds)}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleBackToTopics}
              className={`rounded-xl border px-3 py-2 text-sm transition ${palette.quizSecondaryButton}`}
            >
              Back to topics
            </button>
          </div>

          <p className={`typo-body-relaxed font-medium ${palette.title}`}>{activeQuestion.questionText}</p>

          <div className="mt-4 space-y-3">
            {activeQuestion.options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === activeQuestion.correctAnswer;

              let optionClass = palette.optionButton;
              if (!isCurrentQuestionRevealed && isSelected) {
                optionClass = palette.optionSelected;
              }

              if (isCurrentQuestionRevealed && isCorrect) {
                optionClass = palette.optionCorrect;
              }

              if (isCurrentQuestionRevealed && isSelected && !isCorrect) {
                optionClass = palette.optionWrong;
              }

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelectAnswer(option)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${optionClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {isCurrentQuestionRevealed && hasAnsweredCurrentQuestion ? (
            <div className="mt-4 space-y-2">
              <p className={`text-sm font-semibold ${selectedAnswer === activeQuestion.correctAnswer ? palette.successText : palette.wrongText}`}>
                {selectedAnswer === activeQuestion.correctAnswer
                  ? "Correct answer"
                  : `Correct answer: ${activeQuestion.correctAnswer}`}
              </p>
              {activeQuestion.explanation ? (
                <p className={`text-sm ${palette.description}`}>{activeQuestion.explanation}</p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className={`text-sm ${palette.description}`}>
              Answered: {answeredCount}/{activeTopic.questions.length}
              {isSubmitted ? ` | Score: ${score}/${activeTopic.questions.length}` : ""}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`rounded-xl border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${palette.quizSecondaryButton}`}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  currentQuestionIndex === activeTopic.questions.length - 1 ||
                  !hasAnsweredCurrentQuestion
                }
                className={`rounded-xl border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${palette.quizSecondaryButton}`}
              >
                Next
              </button>
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={isSubmitted || answeredCount === 0}
                className={`rounded-xl border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${palette.quizButton}`}
              >
                {isSubmitted ? "Submitted" : "Submit quiz"}
              </button>
            </div>
          </div>

          {isSubmitted ? (
            <div className={`mt-4 rounded-xl border px-4 py-3 ${palette.listWrap}`}>
              {isTimeUp ? (
                <p className={`text-sm font-semibold ${palette.wrongText}`}>Time is up. Your simulation was submitted automatically.</p>
              ) : null}
              <p className={`text-base font-semibold ${palette.title}`}>
                Total Mark: {score}/{activeTopic.questions.length}
              </p>
              <p className={`mt-1 text-sm ${palette.description}`}>
                Percentage: {Math.round((score / activeTopic.questions.length) * 100)}%
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default PracticeQuestionsPage;
