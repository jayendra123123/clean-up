const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://jaya:123@cluster0.sdd8ixn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ Database connected successfully"))
  .catch(() => console.log("❌ Database connection failed"));

const loginSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const eventSchema = new mongoose.Schema({
  address: { type: String, required: true },
  workers: { type: String, required: true },
  date: { type: String, required: true }
});

const User = mongoose.model("user", loginSchema);
const Event = mongoose.model("events", eventSchema);

module.exports = { User, Event };
