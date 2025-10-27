// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();

// Load persisted data or initialize if not exists
const DATA_FILE = path.join(__dirname, 'data.json');
let persistedData = { tours: [], bookings: [], bookingId: 1 };

try {
    if (fs.existsSync(DATA_FILE)) {
        persistedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
} catch (err) {
    console.error('Error loading persisted data:', err);
}
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'frontend/images'))); // serve images

// Initialize tours if not loaded from persistence
let tours = persistedData.tours.length > 0 ? persistedData.tours : [
    { id: 1, operator: 'Auckland Cruises', marina: 'Viaduct', times: ['10:00', '14:00'], 
      capacity: [5, 3], maxCapacity: [5, 3], image: '/images/Viaduct Harbour.jpg', x:150, y:200 },
    { id: 2, operator: 'Harbour Adventures', marina: 'Westhaven', times: ['09:00', '13:00'], 
      capacity: [0, 4], maxCapacity: [0, 4], image: '/images/West Haven.jpg', x:250, y:180 },
    { id: 3, operator: 'Island Tours', marina: 'Devonport', times: ['11:00', '15:00'], 
      capacity: [2, 2], maxCapacity: [2, 2], image: '/images/Devonport.webp', x:800, y:150 },
    { id: 4, operator: 'Eco Cruises', marina: 'Mission Bay', times: ['10:30', '14:30'], 
      capacity: [6, 5], maxCapacity: [6, 5], image: '/images/Wynyard Quarter.jpg', x:950, y:400 },
    { id: 5, operator: 'Sunset Sail', marina: 'Hobson Bay', times: ['12:00', '16:00'], 
      capacity: [0, 0], maxCapacity: [0, 0], image: '/images/Birkenhead.webp', x:700, y:350 }
];

let bookings = persistedData.bookings || [];
let bookingId = persistedData.bookingId || 1;

// Function to save data to file
const saveData = () => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ 
            tours, bookings, bookingId 
        }));
    } catch (err) {
        console.error('Error saving data:', err);
    }
};

app.get('/api/tours', (req, res) => {
    const toursWithFullUrls = tours.map(tour => ({
        ...tour,
        image: `http://localhost:${PORT}${tour.image}`
    }));
    res.json(toursWithFullUrls);
});
app.get('/api/bookings/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const booking = bookings.find(b => b.id === id);
    res.json(booking || { error: 'Booking not found' });
});
app.post('/api/bookings', (req, res) => {
    const { name, tourId, timeIndex, partySize } = req.body;
    const tour = tours.find(t => t.id === tourId);
    
    if (!tour || tour.capacity[timeIndex] < partySize) {
        return res.status(400).json({ error: 'Not enough capacity' });
    }
    
    tour.capacity[timeIndex] -= partySize;
    const newBooking = {
        id: bookingId++,
        name,
        tourId,
        timeIndex,
        partySize,
        operator: tour.operator,
        marina: tour.marina,
        time: tour.times[timeIndex],
        date: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    saveData(); // Persist the changes
    res.json(newBooking);
});

app.delete('/api/bookings/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const bookingIndex = bookings.findIndex(b => b.id === id);
    
    if (bookingIndex === -1) {
        return res.status(404).json({ error: 'Booking not found' });
    }
    
    const canceledBooking = bookings[bookingIndex];
    const tourToUpdate = tours.find(t => t.id === canceledBooking.tourId);
    
    // Restore capacity
    if (tourToUpdate) {
        tourToUpdate.capacity[canceledBooking.timeIndex] += canceledBooking.partySize;
    }
    
    // Remove booking
    bookings.splice(bookingIndex, 1);
    saveData(); // Persist the changes
    res.json({ message: 'Booking cancelled successfully' });
    });

    // Add endpoint to get all bookings
    app.get('/api/bookings', (req, res) => {
        res.json(bookings);
    });

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
