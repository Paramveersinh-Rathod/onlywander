const express = require("express");
const router = express.Router();

router.get("/privacy", (req, res) => {
    res.render("legal/privacy.ejs");
});

router.get("/terms", (req, res) => {
    res.render("legal/terms.ejs");
});

// Route for all placeholder pages
const placeholderRoutes = [
    '/about', 
    '/careers', 
    '/press', 
    '/policies', 
    '/trending', 
    '/giftcards', 
    '/guides'
];

router.get(placeholderRoutes, (req, res) => {
    res.render("legal/not_ready.ejs");
});


module.exports = router;
