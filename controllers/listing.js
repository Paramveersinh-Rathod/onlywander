const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const { sendBookingRequestEmail } = require("../utils/mailer.js");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  let userWishlist = [];
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
          userWishlist = user.wishlist;
      }
  }
  res.render("./listings/index.ejs", { allListings, userWishlist});
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const reviewPage = parseInt(req.query.page) || 1;
  const reviewsLimit = 2;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
      options: { sort: { createdAt: -1 } } // Sort all reviews by newest first
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  const allReviews = listing.reviews;
  
  // Calculate Average Rating from all reviews
  let averageRating = 0;
  if (allReviews && allReviews.length > 0) {
      let totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / allReviews.length).toFixed(1);
  }

  // Manually paginate the reviews array
  const totalReviews = allReviews.length;
  const totalReviewPages = Math.ceil(totalReviews / reviewsLimit);
  const startIndex = (reviewPage - 1) * reviewsLimit;
  const endIndex = reviewPage * reviewsLimit;
  
  // Replace the full reviews array with just the slice for the current page
  listing.reviews = allReviews.slice(startIndex, endIndex);

  res.render("./listings/show.ejs", {
    listing,
    averageRating,
    totalReviewPages,
    currentReviewPage: reviewPage,
    totalReviews
  });
};


module.exports.createListing = async (req, res) => {
  let response = await geocodingClient.forwardGeocode({
    query: req.body.listing.location,
    limit: 1
  }).send()
  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = {filename, url};
  newListing.geometry = response.body.features[0].geometry;
  let savedListing = await newListing.save();
  req.flash("success", "New listing Created!");
  res.redirect("/listings");
};

module.exports.renderNewForm = (req, res) => {
  res.render("./listings/new.ejs", { mapToken: process.env.MAP_TOKEN });
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("./listings/edit.ejs", { listing, originalImageUrl, mapToken: process.env.MAP_TOKEN }); 
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if( typeof req.file != "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {filename,url};
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.toggleWishlist = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const isFavorited = user.wishlist.includes(id);

    if (isFavorited) {
        await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: id } });
    } else {
        await User.findByIdAndUpdate(req.user._id, { $push: { wishlist: id } });
    }

    res.status(200).json({ isFavorited: !isFavorited });
};

module.exports.handleBookingRequest = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const today = new Date().setHours(0, 0, 0, 0);
    const lastRequestDate = user.lastBookingRequestDate ? new Date(user.lastBookingRequestDate).setHours(0, 0, 0, 0) : null;

    if (lastRequestDate === today && user.bookingRequestsCount >= 5) {
        req.flash("error", "You have reached your daily limit of 5 booking requests.");
        return res.redirect(`/listings/${id}`);
    }

    // If it's a new day, reset the counter
    if (lastRequestDate !== today) {
        user.bookingRequestsCount = 0;
    }

    user.bookingRequestsCount += 1;
    user.lastBookingRequestDate = new Date();
    await user.save();

    const listing = await Listing.findById(id).populate("owner");
    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    const bookingDetails = {
        ...req.body,
        listingTitle: listing.title,
        guestName: req.user.username,
        guestEmail: req.user.email
    };

    try {
        await sendBookingRequestEmail(listing.owner.email, bookingDetails);
        req.flash("success", "Your booking request has been sent to the host!");
    } catch (error) {
        console.error("Booking request email error:", error);
        req.flash("error", "Sorry, we couldn't send your booking request. Please try again later.");
    }

    res.redirect(`/listings/${id}`);
};
