require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cookies = require("cookie-parser");

const notesRoutes = require("./routes/noteRoutes");
const authRoutes = require("./routes/authRouter");

const app = express();
const PORT = process.env.PORT || 3000;


// Cloudinary and Multer setup
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
cloudinary.config({
   cloud_name: process.env.CLOUD_NAME,
   api_key: process.env.API_KEY,
   api_secret: process.env.API_SECRET,
});


// Upload page route
app.get("/upload", (req, res) => {
   res.render("upload");
});

// Upload files to Cloudinary
app.post("/upload", upload.array("files"), async (req, res) => {
   try {
      let uploadedUrls = [];
      for (const file of req.files) {
         try {
            const result = await cloudinary.uploader.upload(file.path, {
               folder: "myFolder",
            });
            uploadedUrls.push(result.secure_url);
         } catch (err) {
            console.error("Cloudinary Error:", err);
         } finally {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
         }
      }
      res.send({
         message: "Folder uploaded successfully",
         files: uploadedUrls,
      });
   } catch (err) {
      res.status(500).send(err);
   }
});



//  APP CONFIGURATION

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookies());

const session = require('express-session');
// ...existing code...

const mongoUrl = process.env.MONGODB_URL;

mongoose
   .connect(mongoUrl)
   .then(() => console.log(" Connected to MongoDB Atlas"))
   .catch((err) => console.error(" MongoDB connection error:", err));


//  ROUTES


var flash = require('connect-flash');
app.use(session({
   secret: 'keyboard cat',
   resave: false,
   saveUninitialized: true,
   cookie: { maxAge: 60000 }
}));
app.use(flash());

app.use("/", authRoutes);
app.use("/", notesRoutes);


//  SERVER START


app.listen(PORT, () => {
   console.log(` Server running on http://localhost:${PORT}`);
});
