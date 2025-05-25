const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // e.g., "09:00" (HH:MM format)
      default: null,
    },
    endTime: {
      type: String, // e.g., "11:00" (HH:MM format)
      default: null,
    },
    type: {
      type: String,
      enum: ["holiday", "exam"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);
