const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isAdmin } = require("../middleware.js");
const adminController = require("../controllers/admin.js");

// All routes in this file will be prefixed with /admin

router.get("/", isLoggedIn, isAdmin, wrapAsync(adminController.renderDashboard));

router.post("/users", isLoggedIn, isAdmin, wrapAsync(adminController.createUser));

router.route("/users/:id")
    .put(isLoggedIn, isAdmin, wrapAsync(adminController.updateUser))
    .delete(isLoggedIn, isAdmin, wrapAsync(adminController.deleteUser));

module.exports = router;
