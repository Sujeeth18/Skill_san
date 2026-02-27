const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  complaintText: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "Pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);