require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cookies = require("cookie-parser");

const notesRoutes = require("./routes/noteRoutes");
const authRoutes = require("./routes/authRouter");

const app = express();
const PORT = process.env.PORT || 3000;


  //  APP CONFIGURATION

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookies()); // Use cookie-parser middleware

  //  DATABASE CONNECTION

const mongoUrl = process.env.MONGODB_URL;

mongoose
   .connect(mongoUrl)
   .then(() => console.log(" Connected to MongoDB Atlas"))
   .catch((err) => console.error(" MongoDB connection error:", err));


  //  ROUTES

app.use("/", authRoutes);
app.use("/", notesRoutes);


//  SERVER START


app.listen(PORT, () => {
   console.log(` Server running on http://localhost:${PORT}`);
});
