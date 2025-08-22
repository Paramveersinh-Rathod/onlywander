const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Review = require("../models/review.js");

const { data: sampleUsers } = require("./userData.js");
const { data: sampleListings } = require("./listingData.js");
const { data: sampleReviews } = require("./reviewData.js");

const MONGO_URL = "mongodb+srv://paramvirrathod12:11223344@cluster0.tzuk2qr.mongodb.net/onlywander?retryWrites=true&w=majority&appName=Cluster0";

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  // 1. Clear existing data
  console.log("Clearing existing data...");
  await Review.deleteMany({});
  await Listing.deleteMany({});
  await User.deleteMany({});
  console.log("Data cleared.");

  // 2. Create users
  console.log("Creating users...");
  const registeredUsers = [];
  for (let userData of sampleUsers) {
    const { username, email, password, role } = userData;
    const newUser = new User({ username, email, role });
    const registeredUser = await User.register(newUser, password);
    registeredUsers.push(registeredUser);
  }
  // Find the specific admin and regular users
  const adminUser = registeredUsers.find((user) => user.role === "admin");
  const regularUsers = registeredUsers.filter((user) => user.role === "user");
  console.log("Users created.");

  // 3. Create listings with the ADMIN as the owner
  console.log("Creating listings with the admin user as owner...");
  const listingsWithOwner = sampleListings.map((listing) => ({
    ...listing,
    // Assign the admin user as the owner for all listings
    owner: adminUser._id,
  }));
  const createdListings = await Listing.insertMany(listingsWithOwner);
  console.log("Listings created.");

  // 4. Add reviews from REGULAR users
  console.log("Adding a realistic set of reviews from regular users...");
  for (const listing of createdListings) {
    // Decide if a listing gets reviews (e.g., 80% chance)
    if (Math.random() < 0.8) {
        // Shuffle regular users to randomize who reviews
        const shuffledUsers = [...regularUsers].sort(() => 0.5 - Math.random());
        // Decide how many reviews (1 to 3, since we have 3 regular users)
        const reviewCount = Math.floor(Math.random() * regularUsers.length) + 1;
        
        // Create the reviews, ensuring no user reviews the same listing twice
        for (let i = 0; i < reviewCount; i++) {
            const reviewAuthor = shuffledUsers[i];
            const randomReviewData = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
            
            const newReview = new Review({
                ...randomReviewData,
                author: reviewAuthor._id,
            });
            
            const savedReview = await newReview.save();
            listing.reviews.push(savedReview);
        }
        await listing.save();
    }
  }
  console.log("Reviews added.");

  console.log("Database initialization complete!");
};

initDB().then(() => {
  mongoose.connection.close();
});
