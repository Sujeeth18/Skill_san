require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Complaint Schema
const ComplaintSchema = new mongoose.Schema({
  category: String,
  description: String,
  priority: String,
  status: { type: String, default: "Pending" }
});

const Complaint = mongoose.model("Complaint", ComplaintSchema);

// Routes

// Create complaint
app.post("/api/complaints", async (req, res) => {
  const complaint = new Complaint(req.body);
  await complaint.save();
  res.json(complaint);
});

// Get all complaints
app.get("/api/complaints", async (req, res) => {
  const complaints = await Complaint.find();
  res.json(complaints);
});

// Update complaint status
app.put("/api/complaints/:id", async (req, res) => {
  const updated = await Complaint.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(updated);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});