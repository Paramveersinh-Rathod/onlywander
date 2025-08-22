const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    const userId = req.user._id;

    // Check if the user has already reviewed this listing
    const existingReview = listing.reviews.find(review => review.author.equals(userId));

    if (existingReview) {
        // If a review exists, update it
        existingReview.rating = req.body.review.rating;
        existingReview.comment = req.body.review.comment;
        existingReview.createdAt = Date.now();
        await existingReview.save();
        req.flash("success", "Your review has been updated!");
    } else {
        // If no review exists, create a new one
        const newReview = new Review(req.body.review);
        newReview.author = userId;
        listing.reviews.push(newReview);
        await newReview.save();
        await listing.save();
        req.flash("success", "New review created!");
    }

    // After creating/updating, check if the listing should be trending
    const updatedListing = await Listing.findById(id).populate("reviews");
    if (updatedListing.reviews.length > 5) {
        await Listing.findByIdAndUpdate(id, { $addToSet: { features: "trending" } });
    }

    res.redirect(`/listings/${id}`);
};


module.exports.deleteReview = async (req, res) => {
    let {id, reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!")
    res.redirect(`/listings/${id}`);
}
