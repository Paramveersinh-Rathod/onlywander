const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.renderDashboard = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || "";

    let query = {};
    if (searchQuery) {
        query = {
            $or: [
                { username: { $regex: searchQuery, $options: "i" } },
                { email: { $regex: searchQuery, $options: "i" } },
            ],
        };
    }

    const users = await User.find(query).skip(skip).limit(limit);
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/index.ejs", {
        users,
        currentPage: page,
        totalPages,
        searchQuery,
    });
};

module.exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const newUser = new User({ email, username, role });
        await User.register(newUser, password);
        req.flash("success", "New user created successfully!");
    } catch (e) {
        req.flash("error", e.message);
    }
    res.redirect("/admin");
};


module.exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, role } = req.body;

    const userToUpdate = await User.findById(id);

    if (userToUpdate.email === 'paramvirrathod12@gmail.com') {
        req.flash("error", "The super admin's role cannot be changed.");
        return res.redirect("/admin");
    }

    await User.findByIdAndUpdate(id, { username, email, role });
    req.flash("success", "User updated successfully!");
    res.redirect("/admin");
};

module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting the super admin
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            req.flash("error", "User not found.");
            return res.redirect("/admin");
        }
        if (userToDelete.email === 'paramvirrathod12@gmail.com') {
            req.flash("error", "The super admin cannot be deleted.");
            return res.redirect("/admin");
        }

        // Step 1: Delete all listings owned by the user.
        // The post middleware in the Listing model will handle associated reviews.
        await Listing.deleteMany({ owner: id });

        // Step 2: Delete all reviews authored by the user on other's listings.
        await Review.deleteMany({ author: id });

        // Step 3: Finally, delete the user.
        await User.findByIdAndDelete(id);

        req.flash("success", "User and all associated data have been deleted.");
    } catch (e) {
        req.flash("error", "Something went wrong while deleting the user.");
    }
    res.redirect("/admin");
};
