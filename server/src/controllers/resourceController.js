const Resource = require("../models/Resource");
const Note = require("../models/Note");
const { callAI } = require("../services/aiProvider");

async function generateCourseNote(resource) {
  const fallback = [
    `Course Title: ${resource.course}`,
    "",
    `Chapter 1: Core ideas in ${resource.course}`,
    "- Focus on key definitions, formulas, and terms.",
    "- Start with the basics before solving problems.",
    "- Add short examples after each major concept.",
    "",
    "Summary:",
    "- Build a strong foundation and revise often.",
    "",
    "Chapter 2: Problem-solving methods",
    "- Break down questions into smaller steps.",
    "- Use diagrams, formulas, or rules where needed.",
    "",
    "Summary:",
    "- Use a repeatable method for each question type.",
    "",
    "Chapter 3: Common mistakes and fixes",
    "- Identify frequent errors students make in this course.",
    "- Add quick correction tips for each mistake.",
    "",
    "Summary:",
    "- Learning from mistakes improves accuracy quickly.",
    "",
    "Chapter 4: Practice and exam readiness",
    "- Solve past questions related to this course.",
    "- Track mistakes and revise weak topics.",
    "",
    "Summary:",
    "- Practice consistently and review mistakes to improve scores."
  ].join("\n");

  const systemPrompt = "You are an expert tutor. Return detailed, structured course notes in simple student language.";
  const userPrompt = [
    `Create structured study notes for this course: ${resource.course}.`,
    "Use this exact output format:",
    "Course Title: <name>",
    "",
    "Chapter 1: <title>",
    "- Explanation",
    "- Key points",
    "",
    "Summary:",
    "...",
    "",
    "Chapter 2: <title>",
    "- Explanation",
    "- Key points",
    "",
    "Summary:",
    "...",
    "",
    "Chapter 3: <title>",
    "- Explanation",
    "- Key points",
    "",
    "Summary:",
    "...",
    "",
    "Chapter 4: <title>",
    "- Explanation",
    "- Key points",
    "",
    "Summary:",
    "...",
    "",
    `Context: department=${resource.department}, year=${resource.year}, tags=${(resource.tags || []).join(", ") || "none"}`,
    "Write 4-6 chapters, each with 8-12 bullet points.",
    "Keep language simple and include short examples where useful.",
    "Target length: about 1200-1800 words (a few note pages)."
  ].join("\n");

  try {
    const ai = await callAI({ systemPrompt, userPrompt, maxTokens: 2600 });
    const noteContent = typeof ai?.text === "string" && ai.text.trim() ? ai.text.trim() : fallback;

    await Note.findOneAndUpdate(
      { course: resource.course },
      {
        name: resource.course,
        course: resource.course,
        resourceId: resource._id,
        content: noteContent,
        generatedBy: "ai"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (_error) {
    await Note.findOneAndUpdate(
      { course: resource.course },
      {
        name: resource.course,
        course: resource.course,
        resourceId: resource._id,
        content: fallback,
        generatedBy: "fallback"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function listResources(req, res) {
  try {
    const query = {};

    if (req.query.course) {
      query.course = req.query.course;
    }
    if (req.query.department) {
      query.department = req.query.department;
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });

    return res.json(resources);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function createResource(req, res) {
  try {
    const { title, course, department, year, fileUrl, tags, rating } = req.body;

    const resolvedUrl = (req.file && req.file.path) || fileUrl;
    if (!course || !resolvedUrl) {
      return res.status(400).json({
        message: "course and fileUrl/file upload are required"
      });
    }

    const parsedRating = Number(rating);
    const normalizedRating = Number.isFinite(parsedRating)
      ? Math.max(0, Math.min(5, parsedRating))
      : 4.6;

    const normalizedTitle = typeof title === "string" && title.trim() ? title.trim() : course.trim();
    const normalizedDepartment = typeof department === "string" && department.trim() ? department.trim() : "General";
    const normalizedYear = typeof year === "string" && year.trim() ? year.trim() : "N/A";

    const resource = await Resource.create({
      title: normalizedTitle,
      course: course.trim(),
      department: normalizedDepartment,
      year: normalizedYear,
      fileUrl: resolvedUrl,
      rating: normalizedRating,
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      uploadedBy: req.user.id
    });

    // Auto-generate or refresh the course note whenever a course PDF is uploaded.
    await generateCourseNote(resource);

    return res.status(201).json(resource);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function trackDownload(req, res) {
  try {
    const { id } = req.params;
    const resource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    return res.json(resource);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  listResources,
  createResource,
  trackDownload
};
