import mongoose from "mongoose";

const searchSchema = new mongoose.Schema({
  url: String,
  title: String,
  description: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Search", searchSchema);
