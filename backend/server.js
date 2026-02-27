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

// Admin configuration (can be extended via environment variable)
// Format: ADMIN_USERS=id1:pass1,id2:pass2,...
const adminString = process.env.ADMIN_USERS || "admin001:Admin@123";
const admins = adminString.split(",").map(pair => {
  const [id, pw] = pair.split(":");
  return { id, pw };
});

// Complaint Schema
const ComplaintSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "Pending"
  },
  adminNotes: {
    type: String,
    default: ""
  }
}, { timestamps: true });

const Complaint = mongoose.model("Complaint", ComplaintSchema);

// Routes

// Create complaint
app.post("/api/complaints", async (req, res) => {
  const complaint = new Complaint(req.body);
  await complaint.save();
  res.json(complaint);
});

// Admin login (simple example using env-configured users)
app.post("/api/admin/login", (req, res) => {
  const { adminId, password } = req.body;
  const user = admins.find(u => u.id === adminId && u.pw === password);
  if (user) {
    return res.json({ message: "Login successful" });
  }
  res.status(401).json({ message: "Invalid Admin ID or Password" });
});

// Get all complaints
app.get("/api/complaints", async (req, res) => {
  const complaints = await Complaint.find();
  res.json(complaints);
});

// Update complaint status
app.put("/api/complaints/:id", async (req, res) => {
  try {
    const updateData = {};
    
    if (req.body.status) {
      updateData.status = req.body.status;
    }
    
    if (req.body.adminNotes) {
      updateData.adminNotes = req.body.adminNotes;
    }
    
    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete complaint (optional)
app.delete("/api/complaints/:id", async (req, res) => {
  try {
    const deleted = await Complaint.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});