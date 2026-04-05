const User = require("../models/User");
const AIAnalytics = require("../models/AIAnalytics");
const Attempt = require("../models/Attempt");
const { toAverageMap, weakSubjectsFromScores } = require("../utils/analytics");
const { generateRecommendation } = require("../services/huggingFace");
const { callAI } = require("../services/aiProvider");

function extractJsonObject(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    // no-op
  }

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch?.[1]) {
    try {
      return JSON.parse(codeFenceMatch[1]);
    } catch (_error) {
      // no-op
    }
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (_error) {
      // no-op
    }
  }

  return null;
}

async function callAIWithFallback(options) {
  try {
    return await callAI(options);
  } catch (_error) {
    return {
      text: "",
      meta: {
        provider: "local-fallback",
        model: "deterministic"
      }
    };
  }
}

function buildFallbackQuiz({ subject, topic, count }) {
  const safeCount = Math.max(1, Math.min(10, Number(count || 5)));
  return Array.from({ length: safeCount }, (_, index) => {
    const questionNumber = index + 1;
    const questionText = `[${subject}] ${topic} practice question ${questionNumber}: Which option best matches the core concept?`;
    const options = [
      `${topic} main principle`,
      `${topic} unrelated rule`,
      "A random fact",
      "None of the above"
    ];

    return {
      questionText,
      options,
      correctAnswer: options[0],
      explanation: `The first option reflects the main principle typically tested for ${topic}.`
    };
  });
}

function normalizeTopicPerformance(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      topic: typeof item?.topic === "string" ? item.topic.trim() : "",
      accuracy: Number(item?.accuracy || item?.accuracyPercentage || 0)
    }))
    .filter((item) => item.topic);
}

function normalizeChatHistory(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: typeof item?.content === "string" ? item.content.trim() : ""
    }))
    .filter((item) => item.content)
    .slice(-10);
}

function generateDeterministicChatReply(message, history = []) {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();
  const recentUserMessages = history
    .filter((item) => item.role === "user")
    .map((item) => item.content.toLowerCase())
    .slice(-4);

  const isGreeting = /\b(hi|hello|hey|selam|good morning|good evening|how are you)\b/i.test(lower);
  if (isGreeting) {
    return "I am doing well and ready to help. Tell me your subject, your current level, and your exam timeline, and I will build a focused study plan for you.";
  }

  const wantsToStudy = /\b(i want to study|study|learn|prepare|revision|review)\b/i.test(lower);
  const databaseMentioned = /\b(database|dbms|sql|normalization|entity relationship|er diagram)\b/i.test(lower)
    || recentUserMessages.some((item) => /\b(database|dbms|sql)\b/i.test(item));

  if (wantsToStudy && databaseMentioned) {
    return [
      "Great choice. Here is a practical Database study path:",
      "1) Core concepts: DBMS basics, ER model, relational model, keys, constraints.",
      "2) SQL mastery: SELECT, JOIN, GROUP BY, subqueries, INSERT/UPDATE/DELETE.",
      "3) Design topics: normalization (1NF-3NF/BCNF), schema design, transactions, ACID.",
      "4) Practice loop: 20 SQL questions daily + 1 timed mixed quiz every 2 days.",
      "5) Error review: keep a mistake log and revise weak areas every weekend.",
      "If you want, I can generate a 7-day Database plan right now based on your available hours."
    ].join("\n");
  }

  if (databaseMentioned) {
    return [
      "For Database, start with this order:",
      "- Day 1-2: ER diagrams, keys, constraints",
      "- Day 3-4: SQL queries and joins",
      "- Day 5: normalization + transactions",
      "- Day 6-7: past questions + weak-area review",
      "Share your available hours per week and I will tailor this into a precise schedule."
    ].join("\n");
  }

  if (/\b(quiz|question|practice)\b/i.test(lower)) {
    return "I can generate targeted practice for you. Tell me: subject, topic, difficulty (easy/medium/hard), and number of questions.";
  }

  if (/\b(summary|summarize|note)\b/i.test(lower)) {
    return "I can help summarize your material into key points, core concepts, common mistakes, and quick practice tasks. Upload/select your note, then click Summarize Note.";
  }

  return "I can help with study plans, concept explanations, summaries, and quiz practice. Tell me your subject and goal, for example: 'I want a 7-day database study plan for 10 hours/week'.";
}

function normalizeTopicList(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

function normalizePreferredStudyTime(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (["morning", "afternoon", "evening", "night"].includes(normalized)) {
    return normalized;
  }
  return "evening";
}

function toSafeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function estimateTrendLabel(scores = []) {
  if (!Array.isArray(scores) || scores.length < 2) {
    return "stable";
  }

  const first = toSafeNumber(scores[0], 0);
  const last = toSafeNumber(scores[scores.length - 1], first);
  const delta = last - first;

  if (delta >= 8) {
    return "improving";
  }

  if (delta <= -8) {
    return "declining";
  }

  return "stable";
}

function buildWeeklySchedule({
  hoursPerWeek,
  weakTopics,
  completedChapters,
  preferredStudyTime,
  quizScores,
  examDate
}) {
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weak = Array.isArray(weakTopics) && weakTopics.length ? weakTopics : ["Core weak topic", "Secondary weak topic"];
  const completed = Array.isArray(completedChapters) && completedChapters.length
    ? completedChapters
    : ["Recent completed chapter"];
  const trend = estimateTrendLabel(quizScores);
  const examHint = examDate ? `Target exam date: ${examDate}.` : "No exam date set yet.";

  const totalMinutes = Math.max(60, Math.round(Number(hoursPerWeek || 8) * 60));
  const base = Math.floor(totalMinutes / 7);
  const remainder = totalMinutes - (base * 7);

  return weekDays.map((day, index) => {
    const durationMinutes = base + (index < remainder ? 1 : 0);
    const weakTopic = weak[index % weak.length];
    const reinforcementTopic = completed[index % completed.length];

    if (index === 5) {
      return {
        day,
        durationMinutes,
        focus: "Mock quiz and error log",
        studyTime: preferredStudyTime,
        tasks: [
          `Take a timed mixed quiz (${trend === "declining" ? "25" : "30"} questions).`,
          "Review every wrong answer and write the exact reason.",
          `Revise ${weakTopic} with short notes and one recall sheet.`,
          examHint
        ]
      };
    }

    if (index === 6) {
      return {
        day,
        durationMinutes,
        focus: "Weekly review and planning",
        studyTime: preferredStudyTime,
        tasks: [
          "Retake 10-15 questions from your weakest areas.",
          `Summarize gains in ${weakTopic} and gaps in ${reinforcementTopic}.`,
          "Plan the next week using your latest weak-topic errors.",
          examHint
        ]
      };
    }

    return {
      day,
      durationMinutes,
      focus: weakTopic,
      studyTime: preferredStudyTime,
      tasks: [
        `Read and annotate notes for ${weakTopic} (20-30 minutes).`,
        `Solve 15-20 focused questions on ${weakTopic}.`,
        `Spend 15 minutes revising one strong area: ${reinforcementTopic}.`,
        trend === "declining"
          ? "Finish with a quick active-recall drill before ending the session."
          : "Finish with 5 flashcard or recall prompts from today's errors."
      ]
    };
  });
}

function normalizeWeeklySchedule(items, fallback) {
  if (!Array.isArray(items) || items.length < 7) {
    return fallback;
  }

  return items.slice(0, 7).map((item, index) => {
    const fallbackDay = fallback[index] || { day: `Day ${index + 1}`, durationMinutes: 60, focus: "Study", tasks: [] };
    return {
      day: typeof item?.day === "string" && item.day.trim() ? item.day.trim() : fallbackDay.day,
      durationMinutes: Math.max(20, Math.round(toSafeNumber(item?.durationMinutes, fallbackDay.durationMinutes))),
      focus: typeof item?.focus === "string" && item.focus.trim() ? item.focus.trim() : fallbackDay.focus,
      studyTime: typeof item?.studyTime === "string" && item.studyTime.trim() ? item.studyTime.trim() : fallbackDay.studyTime,
      tasks: Array.isArray(item?.tasks)
        ? item.tasks.map((task) => String(task || "").trim()).filter(Boolean).slice(0, 6)
        : fallbackDay.tasks
    };
  });
}

function chunkScores(attempts, chunkSize = 10) {
  if (!Array.isArray(attempts) || attempts.length === 0) {
    return [];
  }

  const ordered = attempts.slice().reverse();
  const chunks = [];

  for (let i = 0; i < ordered.length; i += chunkSize) {
    const chunk = ordered.slice(i, i + chunkSize);
    const correct = chunk.filter((item) => item.isCorrect).length;
    const accuracy = Number(((correct / chunk.length) * 100).toFixed(2));
    chunks.push(accuracy);
  }

  return chunks.slice(-6);
}

async function derivePerformanceSnapshot({ userId, requestedCourse = "", minutesPerAttempt = 2 }) {
  const baseMatch = { userId };
  const courseMatch = requestedCourse ? { ...baseMatch, course: requestedCourse } : baseMatch;

  const [allCourseStats, topicStats, recentAttempts] = await Promise.all([
    Attempt.aggregate([
      { $match: baseMatch },
      { $group: { _id: "$course", attempts: { $sum: 1 } } },
      { $sort: { attempts: -1, _id: 1 } }
    ]),
    Attempt.aggregate([
      { $match: courseMatch },
      {
        $group: {
          _id: "$topic",
          attempts: { $sum: 1 },
          correct: {
            $sum: {
              $cond: [{ $eq: ["$isCorrect", true] }, 1, 0]
            }
          }
        }
      },
      { $sort: { attempts: -1, _id: 1 } }
    ]),
    Attempt.find(courseMatch)
      .sort({ createdAt: -1 })
      .limit(60)
      .select("isCorrect")
      .lean()
  ]);

  const selectedCourse = requestedCourse || allCourseStats[0]?._id || "General";

  const normalizedTopicStats = topicStats.map((item) => {
    const accuracy = item.attempts ? Number(((item.correct / item.attempts) * 100).toFixed(2)) : 0;
    return {
      topic: item._id || "General",
      attempts: item.attempts,
      correct: item.correct,
      accuracy
    };
  });

  const completedChapters = normalizedTopicStats
    .filter((item) => item.attempts >= 3 && item.accuracy >= 70)
    .map((item) => item.topic)
    .slice(0, 8);

  const weakTopics = normalizedTopicStats
    .filter((item) => item.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .map((item) => item.topic)
    .slice(0, 8);

  const quizScores = chunkScores(recentAttempts, 10);
  const estimatedStudyMinutes = Math.max(0, Number(minutesPerAttempt || 2) * recentAttempts.length);

  return {
    courseName: selectedCourse,
    completedChapters,
    weakTopics,
    quizScores,
    studyTime: {
      minutes: estimatedStudyMinutes,
      hours: Number((estimatedStudyMinutes / 60).toFixed(2)),
      source: "estimated_from_attempts"
    }
  };
}

async function summarizeNotes(req, res) {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const subject = typeof req.body?.subject === "string" && req.body.subject.trim() ? req.body.subject.trim() : "General";

    if (!text) {
      return res.status(400).json({ message: "text is required" });
    }

    const systemPrompt = "You are an exam prep tutor for Ethiopian university students. Keep responses practical, specific, and easy to study from.";
    const userPrompt = [
      `Subject: ${subject}`,
      "Summarize the study content below.",
      "Return JSON with keys:",
      "shortSummary (string),",
      "detailedSummary (string),",
      "keyPoints (string[]),",
      "coreConcepts (string[]),",
      "workedExamples (string[]),",
      "commonMistakes (string[]),",
      "quickPractice (string[]),",
      "examTips (string[]).",
      "Keep language simple and student-friendly.",
      "Make each array specific to the provided subject content. Avoid generic points.",
      "Target 5-8 items for keyPoints/coreConcepts, and 3-6 items for the other arrays.",
      `Content:\n${text}`
    ].join("\n\n");

    const ai = await callAIWithFallback({ systemPrompt, userPrompt, jsonMode: true, maxTokens: 800 });
    const parsed = extractJsonObject(ai.text);

    const fallback = {
      shortSummary: text.slice(0, 280),
      detailedSummary: `This content covers core ideas in ${subject}. Focus on understanding the main definitions, how each method works step by step, and where each method is most effective. Then verify your understanding by solving mixed practice questions and reviewing errors to fix weak areas.`,
      keyPoints: [
        `Identify the main objectives and problem types in ${subject}.`,
        "Understand the key terms and when each concept should be applied.",
        "Compare approaches by efficiency, constraints, and expected output.",
        "Practice interpreting question wording to choose the right method.",
        "Review mistakes and convert them into short revision notes."
      ],
      coreConcepts: [
        "Definitions and notation",
        "Main techniques and selection criteria",
        "Step-by-step reasoning process",
        "Complexity or efficiency trade-offs",
        "Edge cases and correctness checks"
      ],
      workedExamples: [
        "Solve one easy example and explain each step in plain language.",
        "Solve one medium example and justify why the chosen method fits.",
        "Rework one past incorrect question and identify what changed."
      ],
      commonMistakes: [
        "Choosing a method without checking constraints.",
        "Skipping edge-case validation before final answer.",
        "Memorizing formulas without understanding when to apply them.",
        "Not reviewing incorrect answers after practice."
      ],
      quickPractice: [
        "Attempt 10 timed questions focused on one technique.",
        "Summarize each incorrect answer in one sentence.",
        "Repeat a mixed 15-question set and track score improvement."
      ],
      examTips: [
        "Start with questions you can classify quickly by method.",
        "Write brief steps before full solution to avoid logic mistakes.",
        "Leave 10-15 minutes for reviewing edge cases and final checks."
      ]
    };

    const safeArray = (value, fallbackItems, maxItems) => {
      if (!Array.isArray(value)) {
        return fallbackItems;
      }

      const normalized = value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, maxItems);

      return normalized.length ? normalized : fallbackItems;
    };

    const data = {
      shortSummary: typeof parsed?.shortSummary === "string" ? parsed.shortSummary : fallback.shortSummary,
      detailedSummary: typeof parsed?.detailedSummary === "string" ? parsed.detailedSummary : fallback.detailedSummary,
      keyPoints: safeArray(parsed?.keyPoints, fallback.keyPoints, 8),
      coreConcepts: safeArray(parsed?.coreConcepts, fallback.coreConcepts, 8),
      workedExamples: safeArray(parsed?.workedExamples, fallback.workedExamples, 6),
      commonMistakes: safeArray(parsed?.commonMistakes, fallback.commonMistakes, 6),
      quickPractice: safeArray(parsed?.quickPractice, fallback.quickPractice, 6),
      examTips: safeArray(parsed?.examTips, fallback.examTips, 6)
    };

    return res.json({ ok: true, feature: "summarize", data, meta: { ...ai.meta, createdAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function generateQuiz(req, res) {
  try {
    const subject = typeof req.body?.subject === "string" && req.body.subject.trim() ? req.body.subject.trim() : "General";
    const topic = typeof req.body?.topic === "string" && req.body.topic.trim() ? req.body.topic.trim() : subject;
    const difficulty = typeof req.body?.difficulty === "string" ? req.body.difficulty.trim().toLowerCase() : "medium";
    const count = Math.max(1, Math.min(10, Number(req.body?.count || 5)));
    const sourceText = typeof req.body?.sourceText === "string" ? req.body.sourceText.trim() : "";
    const sourceExcerpt = sourceText ? sourceText.slice(0, 5000) : "";

    const systemPrompt = "You create multiple-choice questions for exit exam preparation.";
    const promptParts = [
      `Subject: ${subject}`,
      `Topic: ${topic}`,
      `Difficulty: ${difficulty}`,
      `Generate ${count} questions.`,
      "Return JSON: { questions: [{ questionText, options: [4], correctAnswer, explanation }] }.",
      "correctAnswer must match one option exactly."
    ];

    if (sourceExcerpt) {
      promptParts.push(
        "Use the source material below as the primary reference for question generation.",
        `Source material:\n${sourceExcerpt}`
      );
    }

    const userPrompt = promptParts.join("\n\n");

    const ai = await callAIWithFallback({ systemPrompt, userPrompt, jsonMode: true, maxTokens: 1200 });
    const parsed = extractJsonObject(ai.text);
    const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];

    const questions = rawQuestions
      .map((item) => ({
        questionText: typeof item?.questionText === "string" ? item.questionText.trim() : "",
        options: Array.isArray(item?.options)
          ? item.options.map((option) => (typeof option === "string" ? option.trim() : "")).filter(Boolean).slice(0, 4)
          : [],
        correctAnswer: typeof item?.correctAnswer === "string" ? item.correctAnswer.trim() : "",
        explanation: typeof item?.explanation === "string" ? item.explanation.trim() : ""
      }))
      .filter((item) => item.questionText && item.options.length === 4 && item.correctAnswer && item.options.includes(item.correctAnswer));

    const resolvedQuestions = questions.length ? questions : buildFallbackQuiz({ subject, topic, count });

    return res.json({ ok: true, feature: "quiz", data: { questions: resolvedQuestions }, meta: { ...ai.meta, createdAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function explainAnswer(req, res) {
  try {
    const questionText = typeof req.body?.questionText === "string" ? req.body.questionText.trim() : "";
    const selectedAnswer = typeof req.body?.selectedAnswer === "string" ? req.body.selectedAnswer.trim() : "";
    const correctAnswer = typeof req.body?.correctAnswer === "string" ? req.body.correctAnswer.trim() : "";
    const topic = typeof req.body?.topic === "string" && req.body.topic.trim() ? req.body.topic.trim() : "General";

    if (!questionText || !selectedAnswer || !correctAnswer) {
      return res.status(400).json({ message: "questionText, selectedAnswer, and correctAnswer are required" });
    }

    const systemPrompt = "You are a supportive tutor. Explain in simple language.";
    const userPrompt = [
      `Topic: ${topic}`,
      `Question: ${questionText}`,
      `Student answer: ${selectedAnswer}`,
      `Correct answer: ${correctAnswer}`,
      "Return JSON with keys: whyCorrect (string), whyStudentAnswer (string), memoryTip (string)."
    ].join("\n\n");

    const ai = await callAIWithFallback({ systemPrompt, userPrompt, jsonMode: true, maxTokens: 500 });
    const parsed = extractJsonObject(ai.text);

    const data = {
      whyCorrect: typeof parsed?.whyCorrect === "string" ? parsed.whyCorrect : `The correct answer is ${correctAnswer} because it matches the concept in this topic.`,
      whyStudentAnswer: typeof parsed?.whyStudentAnswer === "string" ? parsed.whyStudentAnswer : `Your selected answer (${selectedAnswer}) does not fully match the required concept.`,
      memoryTip: typeof parsed?.memoryTip === "string" ? parsed.memoryTip : "Write one-line summaries after each question to remember key rules."
    };

    return res.json({ ok: true, feature: "explain", data, meta: { ...ai.meta, createdAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function chatAssistant(req, res) {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const history = normalizeChatHistory(req.body?.history);

    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    const historyBlock = history.length
      ? history.map((item) => `${item.role}: ${item.content}`).join("\n")
      : "No prior messages.";

    const systemPrompt = [
      "You are ExitPrep Assistant, an AI chatbot for Ethiopian university exit-exam students.",
      "Be conversational like ChatGPT, accurate, and practical.",
      "Use concise paragraphs or bullet points when helpful.",
      "If the user asks non-study questions, still reply helpfully and politely."
    ].join(" ");

    const userPrompt = [
      "Conversation history:",
      historyBlock,
      "",
      `Latest user message: ${message}`,
      "",
      "Write a direct helpful reply. Keep under 220 words unless the user explicitly asks for deep detail."
    ].join("\n");

    const ai = await callAIWithFallback({ systemPrompt, userPrompt, maxTokens: 700 });

    const aiText = typeof ai?.text === "string" ? ai.text.trim() : "";
    const reply = aiText || generateDeterministicChatReply(message, history);

    return res.json({
      ok: true,
      feature: "chat",
      data: { reply },
      meta: { ...ai.meta, createdAt: new Date().toISOString() }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function recommendWeakTopics(req, res) {
  try {
    const topicPerformance = normalizeTopicPerformance(req.body?.topicPerformance);
    const weakTopics = topicPerformance
      .filter((item) => item.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 6);

    const systemPrompt = "You are a study coach. Give prioritized actionable recommendations.";
    const userPrompt = [
      "Use this weak topic list to provide action steps.",
      `Weak topics: ${JSON.stringify(weakTopics)}.`,
      "Return JSON with keys: priorities (array of { topic, action, practiceCount })."
    ].join("\n\n");

    const ai = await callAIWithFallback({ systemPrompt, userPrompt, jsonMode: true, maxTokens: 700 });
    const parsed = extractJsonObject(ai.text);
    const priorities = Array.isArray(parsed?.priorities) ? parsed.priorities : weakTopics.map((item) => ({
      topic: item.topic,
      action: "Review core concepts and solve focused practice questions.",
      practiceCount: item.accuracy < 40 ? 25 : 15
    }));

    return res.json({ ok: true, feature: "recommend", data: { weakTopics, priorities }, meta: { ...ai.meta, createdAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function generateStudyPlan(req, res) {
  try {
    const hoursPerWeek = Math.max(1, Number(req.body?.hoursPerWeek || 8));
    const examDate = typeof req.body?.examDate === "string" ? req.body.examDate : "";
    const weakTopicsInput = normalizeTopicList(req.body?.weakTopics);
    const preferredStudyTime = normalizePreferredStudyTime(req.body?.preferredStudyTime);
    const courseNameInput = typeof req.body?.courseName === "string" ? req.body.courseName.trim() : "";
    const completedInput = normalizeTopicList(req.body?.completedChapters);
    const quizScoresInput = Array.isArray(req.body?.quizScores)
      ? req.body.quizScores.map((item) => Number(item)).filter((item) => Number.isFinite(item)).slice(0, 10)
      : [];
    const timeSpentInput = typeof req.body?.timeSpent === "string" ? req.body.timeSpent.trim() : "";
    const autoFromAttempts = req.body?.autoFromAttempts !== false;

    let autoSnapshot = null;
    if (autoFromAttempts) {
      autoSnapshot = await derivePerformanceSnapshot({
        userId: req.user.id,
        requestedCourse: courseNameInput,
        minutesPerAttempt: Number(req.body?.minutesPerAttempt || 2)
      });
    }

    const courseName = courseNameInput || autoSnapshot?.courseName || "General";
    const completedChapters = completedInput.length ? completedInput : autoSnapshot?.completedChapters || [];
    const weakTopics = weakTopicsInput.length ? weakTopicsInput : autoSnapshot?.weakTopics || [];
    const quizScores = quizScoresInput.length ? quizScoresInput : autoSnapshot?.quizScores || [];
    const studyTime = timeSpentInput || (autoSnapshot
      ? `${autoSnapshot.studyTime.hours} hours total (${autoSnapshot.studyTime.minutes} minutes, estimated from attempts)`
      : "Not provided");
    const trend = estimateTrendLabel(quizScores);
    const weeklyScheduleFallback = buildWeeklySchedule({
      hoursPerWeek,
      weakTopics,
      completedChapters,
      preferredStudyTime,
      quizScores,
      examDate
    });

    const systemPrompt = "You are an AI Study Coach for university students. Make plans specific, simple, and actionable.";
    const userPrompt = [
      "Analyze the student's performance data:",
      `- Course: ${courseName}`,
      `- Completed chapters: ${completedChapters.join(", ") || "None yet"}`,
      `- Weak topics: ${weakTopics.join(", ") || "General revision"}`,
      `- Quiz scores: ${quizScores.join(", ") || "No quiz history"}`,
      `- Study time: ${studyTime}`,
      "",
      "Generate a personalized study plan that includes:",
      "1. Clear explanation of what the student should do",
      "2. Why these topics are important",
      "3. What the student will achieve after completing the plan",
      "4. Weekly study schedule (exactly 7 days)",
      "5. Focus areas based on weak performance",
      "6. Specific actions (read notes, practice quizzes, revise topics)",
      "",
      `Additional constraints: hoursPerWeek=${hoursPerWeek}, preferredStudyTime=${preferredStudyTime}, examDate=${examDate || "Not provided"}`,
      "Return strict JSON with keys:",
      "explanation (string),",
      "importance (string[]),",
      "outcomes (string[]),",
      "weeklySchedule (array of exactly 7 items; each item has day, durationMinutes, focus, studyTime, tasks[]),",
      "focusAreas (string[]),",
      "specificActions (string[]).",
      "Avoid generic advice."
    ].join("\n\n");

    const ai = await callAIWithFallback({ systemPrompt, userPrompt, jsonMode: true, maxTokens: 900 });
    const parsed = extractJsonObject(ai.text);

    const weeklySchedule = normalizeWeeklySchedule(parsed?.weeklySchedule || parsed?.dailySchedule, weeklyScheduleFallback);

    const data = {
      explanation: typeof parsed?.explanation === "string"
        ? parsed.explanation
        : `Study ${weakTopics.join(", ") || "your weakest topics"} first, then reinforce with timed mixed practice.` ,
      importance: Array.isArray(parsed?.importance) ? parsed.importance.slice(0, 8) : ["Weak topics reduce overall exam performance if left unaddressed."],
      outcomes: Array.isArray(parsed?.outcomes) ? parsed.outcomes.slice(0, 8) : ["Higher accuracy and stronger retention for exam questions."],
      weeklySchedule,
      dailySchedule: weeklySchedule,
      focusAreas: Array.isArray(parsed?.focusAreas) ? parsed.focusAreas.slice(0, 10) : weakTopics,
      specificActions: Array.isArray(parsed?.specificActions)
        ? parsed.specificActions.slice(0, 12)
        : ["Read notes", "Practice quizzes", "Revise weak topics", "Track incorrect answers"],
      performanceSummary: {
        trend,
        weakTopicCount: weakTopics.length,
        completedChapterCount: completedChapters.length,
        studyHoursPerWeek: hoursPerWeek,
        preferredStudyTime
      },
      autoData: {
        courseName,
        completedChapters,
        weakTopics,
        quizScores,
        studyTime,
        fromAttempts: Boolean(autoSnapshot)
      }
    };

    return res.json({ ok: true, feature: "study-plan", data, meta: { ...ai.meta, createdAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function dashboardRecommendation(req, res) {
  try {
    const requestedStudentId = req.body.studentId || req.user.id;
    const studentId = req.user.role === "student" ? req.user.id : requestedStudentId;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const subjectScores = req.body.subjectScores && Object.keys(req.body.subjectScores).length > 0
      ? req.body.subjectScores
      : toAverageMap(student.activityLog || []);

    const weakSubjects = weakSubjectsFromScores(subjectScores);
    const recommendation = await generateRecommendation(subjectScores, weakSubjects);

    const analyticsRecord = await AIAnalytics.findOneAndUpdate(
      { studentId: student._id },
      {
        $set: {
          weakSubjects,
          aiRecommendations: [recommendation],
          lastGenerated: new Date()
        }
      },
      { upsert: true, new: true }
    );

    return res.json({
      studentId: student._id,
      weakSubjects,
      subjectScores,
      recommendation,
      analyticsId: analyticsRecord._id
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function addActivity(req, res) {
  try {
    const studentId = req.user.role === "student" ? req.user.id : req.body.studentId;
    const { subject, topic, score, total, activityType } = req.body;

    if (!studentId || !subject) {
      return res.status(400).json({ message: "studentId and subject are required" });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.activityLog.push({
      subject,
      topic: typeof topic === "string" && topic.trim() ? topic.trim() : subject,
      score: Number(score || 0),
      total: Number(total || 5),
      activityType: activityType || "practice"
    });

    await student.save();
    return res.status(201).json({ message: "Activity added" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  dashboardRecommendation,
  addActivity,
  summarizeNotes,
  generateQuiz,
  chatAssistant,
  explainAnswer,
  recommendWeakTopics,
  generateStudyPlan
};
