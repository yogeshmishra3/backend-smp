const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Create event
router.post('/', async (req, res) => {
  try {
    // Destructure the necessary fields from the request body
    const { title, date, type } = req.body;

    // Check if required fields are present
    if (!title || !date || !type) {
      return res.status(400).json({ error: 'Event title, date, and type are required.' });
    }

    // Create a new event with the provided data
    const event = new Event({
      title, // Use 'title' field as per the updated schema
      date,
      type
    });

    // Save the event to the database
    await event.save();

    // Return the created event
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { title, date, type } = req.body;

    // Validate the updated event data
    if (!title || !date || !type) {
      return res.status(400).json({ error: 'Event title, date, and type are required.' });
    }

    // Find and update the event in the database
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, date, type },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Return the updated event
    res.json(updatedEvent);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
