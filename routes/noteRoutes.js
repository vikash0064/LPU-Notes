const express = require("express");
const router = express.Router();
const Note = require("../models/note");
const upload = require("../middleware/upload");
const { requireAuth, checkUser } = require("../middleware/authMiddleware");

router.use(checkUser);

// GET ALL NOTES
router.get("/", async (req, res) => {
  try {
    let notes = [];
    if (res.locals.user) {
      notes = await Note.find({ userId: res.locals.user.id }).sort({ createdAt: -1 });
    }
    res.render("index", { notes });
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).send("Error fetching notes: " + err.message);
  }
});


// ADD NOTE
router.post("/add-note", requireAuth, upload.single("media"), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).send("Title & Content required");
    }

    const newNote = new Note({
      title,
      content,
      image: req.file ? req.file.filename : null,
      userId: res.locals.user.id
    });

    await newNote.save();
    res.redirect("/");
  } catch (err) {
    console.error("Error adding note:", err);
    res.status(500).send("Error adding note");
  }
});

// DELETE NOTE
router.post("/delete-note/:id", requireAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: res.locals.user.id });
    if (!note) {
      return res.status(403).send("Unauthorized");
    }
    await Note.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).send("Error deleting note");
  }
});

// EDIT NOTE PAGE
router.get("/edit-note/:id", requireAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: res.locals.user.id });

    if (!note) {
      return res.status(404).send("Note not found");
    }
    res.render("edit", { note });
  } catch (err) {
    console.error("Error fetching note:", err);
    res.status(500).send("Error fetching note");
  }
});

// UPDATE NOTE
router.post("/update-note/:id", requireAuth, upload.single("media"), async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: res.locals.user.id });
    if (!note) {
      return res.status(403).send("Unauthorized");
    }

    const updateData = {
      title: req.body.title,
      content: req.body.content,
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    await Note.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.redirect("/");
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).json({ success: false, error: "Error updating note" });
  }
});

// VIEW NOTE
router.get("/view-note/:id", requireAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: res.locals.user.id });

    if (!note) {
      return res.status(404).send("Note not found");
    }

    res.render("view", { note });
  } catch (err) {
    console.error("Error fetching note:", err);
    res.status(500).send("Error fetching note");
  }
});

module.exports = router;

