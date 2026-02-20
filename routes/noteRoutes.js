const express = require("express");
const router = express.Router();
const Note = require("../models/note");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { requireAuth, checkUser } = require("../middleware/authMiddleware");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

router.use(checkUser);

// List notes with search, sort, and pagination
router.get("/", async (req, res) => {
  try {
    const user = res.locals.user;
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 8;
    const sortOrder = req.query.sort === "oldest" ? 1 : -1;
    const searchQuery = req.query.search || "";
    let notes = [];
    let totalPages = 1;

    if (user) {
      const query = { userId: user.id };
      if (searchQuery) {
        query.title = { $regex: searchQuery, $options: "i" };
      }

      const totalNotes = await Note.countDocuments(query);
      totalPages = Math.ceil(totalNotes / limit) || 1;

      // Use aggregation for relevance-based sorting if searching
      if (searchQuery) {
        notes = await Note.aggregate([
          { $match: query },
          {
            $addFields: {
              relevance: {
                $cond: {
                  if: { $eq: [{ $toLower: "$title" }, searchQuery.toLowerCase()] },
                  then: 3,
                  else: {
                    $cond: {
                      if: { $regexMatch: { input: "$title", regex: "^" + searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options: "i" } },
                      then: 2,
                      else: 1
                    }
                  }
                }
              }
            }
          },
          { $sort: { relevance: -1, createdAt: sortOrder } },
          { $skip: (currentPage - 1) * limit },
          { $limit: limit }
        ]);
        // Convert _id to id for consistency with Mongoose documents if needed, 
        // though EJS usually handles both or we can use note._id in template.
        notes = notes.map(n => ({ ...n, id: n._id }));
      } else {
        notes = await Note.find(query)
          .sort({ createdAt: sortOrder })
          .skip((currentPage - 1) * limit)
          .limit(limit);
      }
    }

    res.render("index", {
      notes,
      currentPage,
      totalPages,
      currentSort: req.query.sort || "newest",
      searchQuery,
      messages: req.flash("success").concat(req.flash("error")),
    });
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).send("Error fetching notes: " + err.message);
  }
});

// Add a new note
router.post("/add-note", requireAuth, upload.single("media"), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      req.flash("error", "Title & Content required");
      return res.redirect("/");
    }
    let imageUrl = null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "LPU Notes",
        });
        imageUrl = result.secure_url;
      } catch (err) {
        console.error("Cloudinary Error:", err);
      } finally {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    }
    const newNote = new Note({
      title,
      content,
      image: imageUrl,
      userId: res.locals.user.id,
    });
    await newNote.save();
    req.flash("success", "Note created successfully!");
    res.redirect("/");
  } catch (err) {
    console.error("Error adding note:", err);
    req.flash("error", "Error adding note");
    res.redirect("/");
  }
});

// Delete a note
router.post("/delete-note/:id", requireAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: res.locals.user.id });
    if (!note) {
      req.flash("error", "Unauthorized");
      return res.redirect("/");
    }
    await Note.findByIdAndDelete(req.params.id);
    req.flash("success", "Note deleted successfully!");
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting note:", err);
    req.flash("error", "Error deleting note");
    res.redirect("/");
  }
});

// Edit note page
router.get("/edit-note/:id", requireAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: res.locals.user.id });
    if (!note) {
      req.flash("error", "Note not found");
      return res.redirect("/");
    }
    res.render("edit", { note });
  } catch (err) {
    console.error("Error fetching note:", err);
    req.flash("error", "Error fetching note");
    res.redirect("/");
  }
});

// Update a note
router.post("/update-note/:id", requireAuth, upload.single("media"), async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: res.locals.user.id });
    if (!note) {
      req.flash("error", "Unauthorized");
      return res.redirect("/");
    }
    const updateData = {
      title: req.body.title,
      content: req.body.content,
    };
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "LPU Notes",
        });
        updateData.image = result.secure_url;
      } catch (err) {
        console.error("Cloudinary Error:", err);
      } finally {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    }
    await Note.findByIdAndUpdate(req.params.id, updateData, { new: true });
    req.flash("success", "Note updated successfully!");
    res.redirect("/");
  } catch (err) {
    console.error("Error updating note:", err);
    req.flash("error", "Error updating note");
    res.redirect("/");
  }
});

// View a note
router.get("/view-note/:id", requireAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: res.locals.user.id });
    if (!note) {
      req.flash("error", "Note not found");
      return res.redirect("/");
    }
    res.render("view", { note });
  } catch (err) {
    console.error("Error fetching note:", err);
    req.flash("error", "Error fetching note");
    res.redirect("/");
  }
});

module.exports = router;

