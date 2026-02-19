const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                res.redirect("/login");
            } else {
                res.locals.user = decoded;
                next();
            }
        });
    } else {
        res.redirect("/login");
    }
};

const checkUser = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                res.locals.user = null;
                next();
            } else {
                res.locals.user = decoded;
                next();
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
};

module.exports = { requireAuth, checkUser };

