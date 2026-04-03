const Resource = require("../models/Resource");

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
