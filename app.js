if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}
const helmet = require('helmet');
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo'); // 1. REQUIRE MONGOSTORE
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js")
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const adminRouter = require("./routes/admin.js");
const legalRouter = require("./routes/legal.js");

const dbUrl = process.env.MONGO_URL;
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

main()
.then(() => {
    console.log("connected to DB")
})
.catch((err) => {
    console.log(err);
})
async function main() {
    await mongoose.connect(dbUrl);
}

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: [
                "'self'",
                "https://api.mapbox.com/",
                "https://*.tiles.mapbox.com/",
                "https://events.mapbox.com/",
            ],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://stackpath.bootstrapcdn.com/",
                "https://api.mapbox.com/",
                "https://cdn.jsdelivr.net/",
                "https://cdnjs.cloudflare.com/",
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://stackpath.bootstrapcdn.com/",
                "https://api.mapbox.com/",
                "https://cdn.jsdelivr.net/",
                "https://fonts.googleapis.com/",
                "https://cdnjs.cloudflare.com/",
                "https://use.fontawesome.com/",
            ],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                `https://res.cloudinary.com/${process.env.CLOUD_NAME}/`,
                "https://images.unsplash.com/",
                "https://plus.unsplash.com/",
            ],
            fontSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com/",
                "https://fonts.gstatic.com/",
            ],
        },
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")))
app.use(express.json());

// 2. CONFIGURE THE STORE
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: secret,
    },
    touchAfter: 24 * 3600 // time period in seconds
});

store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

// 3. USE THE STORE IN YOUR SESSION
const sessionOption = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/admin", adminRouter);
app.use("/", legalRouter);
app.use("/", userRouter);

app.all("/{*any}", (req, res, next) => {
    let err = new ExpressError(404, "Page Not Found");
    next(err);
});

app.use((err, req, res, next) => {
    let {statusCode = 500, message="Something went wrong!"} = err;
    res.status(statusCode).render("error.ejs", {message});
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`server is listening to port ${port}`);
});
