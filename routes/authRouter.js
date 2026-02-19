const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// REGISTER
router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.send("User already exists!");

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });

        await newUser.save();
        res.redirect("/login");
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).send("Error registering user");
    }
});

// LOGIN
router.get("/login", (req, res) => {
    res.render("login", { error: req.query.error });
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.redirect("/login?error=1");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.redirect("/login?error=1");

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.cookie("token", token, { httpOnly: true });
        res.redirect("/");
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Error logging in");
    }
});

// LOGOUT
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

module.exports = router;
