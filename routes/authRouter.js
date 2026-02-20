const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// REGISTER
router.get("/register", (req, res) => {
    res.render("register", { messages: req.flash('success').concat(req.flash('error')) });
});

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'User already exists!');
            return res.redirect('/register');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        req.flash('success', 'Registration successful! Please login.');
        res.redirect("/login");
    } catch (err) {
        console.error("Register error:", err);
        req.flash('error', 'Error registering user');
        res.redirect('/register');
    }
});

// LOGIN
router.get("/login", (req, res) => {
    res.render("login", { error: req.query.error, messages: req.flash('success').concat(req.flash('error')) });
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Invalid email or password!');
            return res.redirect('/login');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password!');
            return res.redirect('/login');
        }
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, { httpOnly: true });
        req.flash('success', 'Login successful!');
        res.redirect("/");
    } catch (err) {
        console.error("Login error:", err);
        req.flash('error', 'Error logging in');
        res.render("login", { error: req.query.error, messages: req.flash('success').concat(req.flash('error')) });
    }
});

// LOGOUT
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

module.exports = router;
