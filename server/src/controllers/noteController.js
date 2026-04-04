const Note = require("../models/Note");

async function listNotes(_req, res) {
  try {
    const notes = await Note.find({}).sort({ updatedAt: -1 }).lean();
    return res.json(notes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  listNotes
};
