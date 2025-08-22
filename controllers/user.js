const User = require("../models/user.js");
const Listing = require("../models/listing.js"); 
const { sendOtpEmail } = require('../utils/mailer.js');


// **UPDATED sendOtp FUNCTION**
module.exports.sendOtp = async (req, res) => {
    try {
        console.log(req.body)
        // Now destructuring username as well
        const { email, username } = req.body;
        console.log(username);
        // 1. Check if the username is already taken
        const existingUsername = await User.findOne({ username });
        console.log(existingUsername);
        if (existingUsername) {
            return res.status(400).json({ message: "This username is already taken. Please choose another one." });
        }

        // 2. Check if the email is already registered
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }

        // If both are unique, proceed with sending the OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        req.session.otp = otp;
        req.session.email = email;
        console.log(otp);
        await sendOtpEmail(email, otp);

        res.status(200).json({ message: "OTP sent successfully. Please check your email." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }
};

// signup function (no change from last step)
module.exports.signup = async(req, res, next) => {
    try {
        const { username, email, password, otp } = req.body;

        if (email !== req.session.email || otp !== req.session.otp) {
            return res.status(400).json({ message: "The OTP you entered is incorrect. Please try again." });
        }

        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);

        delete req.session.otp;
        delete req.session.email;

        req.login(registeredUser, (err) => {
            if (err) {
                return res.status(500).json({ message: "Login failed after registration." });
            }
            req.flash("success", "Welcome to OnlyWander! Your account has been created.");
            return res.status(200).json({ redirectUrl: "/listings" });
        });
    } catch (e) {
        return res.status(400).json({ message: e.message });
    }
};
// ... (rest of the controller)

module.exports.renderSignup =  (req, res) => {
    res.render("users/signup.ejs");
}


module.exports.renderLogin =  (req, res) => {
    res.render("users/login.ejs");
}

module.exports.login = async(req, res) => {
    req.flash("success", "Welcome back to OnlyWander")
    let redirectUrl = res.locals.redirectUrl || "/listings";
    if (redirectUrl.includes("/wishlist")) {
        redirectUrl = redirectUrl.replace("/wishlist", "");
    }
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout((err) => {
        if(err){
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    })
}

module.exports.renderWishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.render('users/wishlist', { wishlist: user.wishlist });
};