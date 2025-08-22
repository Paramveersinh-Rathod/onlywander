const Listing = require("./models/listing.js")
const Review = require("./models/review.js")
const { listingSchema } = require("./schema.js");
const { reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl
        req.flash("error", "you must be logged in to perform this task!")
        return res.redirect("/login")
    }
    next();
}

module.exports.isOwner = async(req, res, next) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error", "You are not owner of this listing!")
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async(req, res, next) => {
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if(!review.author._id.equals(res.locals.currUser._id)){
        req.flash("error", "You are not author of this review!")
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

module.exports.validateReview = (req, res, next) => { 
    let {error} = reviewSchema.validate(req.body);
    if (error) {
        let result = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, result)
    } else {
        next();
    }
}

module.exports.validateListing = (req, res, next) => {
  // Check for the feature limit before validating with Joi
  if (req.body.listing.features && req.body.listing.features.length > 3) {
      throw new ExpressError(400, "A listing can have a maximum of 3 features.");
  }

  const { error } = listingSchema.validate({
    listing: {
      ...req.body.listing,
      image: {
        url: req.file ? req.file.path : "",
      },
    },
  });

  if (error) {
    const result = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, result);
  } else {
    next();
  }
};

module.exports.isLoggedInApi = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // Stop and send a 401 error instead of redirecting
        return res.status(401).json({ error: "You must be logged in." });
    }
    next();
};

module.exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    req.flash('error', 'You do not have permission to access this page.');
    res.redirect('/listings');
};
