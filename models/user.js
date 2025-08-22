const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email:{
        type:String,
        required: true
    },
    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: "Listing"
    }],
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    bookingRequestsCount: {
        type: Number,
        default: 0
    },
    lastBookingRequestDate: {
        type: Date
    }
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);