const Resource = require("../models/Resource");

function isPdfResource(fileUrl) {
  if (typeof fileUrl !== "string" || fileUrl.trim() === "") {
    return false;
  }

  return /\.pdf(?:$|[?#])/i.test(fileUrl);
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

    const resources = await Resource.find(query)
      .populate("uploadedBy", "role")
      .sort({ createdAt: -1 });

    const adminUploadedPdfResources = resources.filter(
      (resource) => resource.uploadedBy?.role === "admin" && isPdfResource(resource.fileUrl)
    );

    return res.json(adminUploadedPdfResources);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function createResource(req, res) {
  try {
    const { title, course, department, year, fileUrl, tags, rating } = req.body;

    const resolvedUrl = (req.file && req.file.path) || fileUrl;
    if (!title || !course || !department || !year || !resolvedUrl) {
      return res.status(400).json({
        message: "title, course, department, year, and fileUrl/file upload are required"
      });
    }

    const parsedRating = Number(rating);
    const normalizedRating = Number.isFinite(parsedRating)
      ? Math.max(0, Math.min(5, parsedRating))
      : 4.6;

    const resource = await Resource.create({
      title,
      course,
      department,
      year,
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
