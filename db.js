const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/login_page", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));
 
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
});

// Method to delete a user by ID
userSchema.statics.deleteUserById = async function (userId) {
  try {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    await user.remove(); // Deletes the user from the database
    return user;
  } catch (error) {
    throw new Error('Error deleting user');
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
