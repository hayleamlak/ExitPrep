const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");

const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const { listResources, createResource, trackDownload, deleteCourse } = require("../controllers/resourceController");

const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
};

const isCloudinaryConfigured =
  Boolean(cloudinaryConfig.cloud_name) &&
  Boolean(cloudinaryConfig.api_key) &&
  Boolean(cloudinaryConfig.api_secret) &&
  cloudinaryConfig.api_secret !== "your-cloudinary-api-secret";

cloudinary.config(cloudinaryConfig);

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "exitprep/resources",
    resource_type: "raw"
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfName = typeof file.originalname === "string" && file.originalname.toLowerCase().endsWith(".pdf");

    if (isPdfMime || isPdfName) {
      cb(null, true);
      return;
    }

    cb(new Error("Only PDF files are allowed."));
  }
});

const router = express.Router();

router.get("/", listResources);
router.post("/:id/download", trackDownload);
router.delete("/course/:courseName", auth, allowRoles("admin"), deleteCourse);
router.post("/", auth, allowRoles("admin"), (req, res, next) => {
  if (!isCloudinaryConfigured) {
    res.status(500).json({
      message:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env and restart the server."
    });
    return;
  }

  upload.single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "PDF is too large. Maximum size is 15MB." });
      return;
    }

    res.status(400).json({ message: error.message || "File upload failed." });
  });
}, createResource);

module.exports = router;
