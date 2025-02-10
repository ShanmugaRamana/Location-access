import express from 'express';
import axios from 'axios'; // Use Axios for API requests
import Location from '../models/Location.js';

const router = express.Router();
const API_KEY = '66d519b7fe594cbd90f4c3eedb6bd556'; // Replace with your API key
const DEFAULT_IP = '24.48.0.1'; // Default IP for localhost

router.get('/', async (req, res, next) => {
    try {
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || DEFAULT_IP;

        // Extract first IP if multiple are provided
        ip = ip.split(',')[0].trim();

        // Convert IPv6-mapped IPv4 (::ffff:xx.xx.xx.xx) to standard IPv4
        if (ip.startsWith('::ffff:')) {
            ip = ip.substring(7);
        }

        // Handle localhost (::1)
        if (ip === '::1' || ip === '127.0.0.1') {
            ip = DEFAULT_IP;
            console.log('Using default IP for localhost.');
        }

        console.log('Detected IP:', ip);

        // API request URL
        const apiUrl = `https://api.ipgeolocation.io/ipgeo?apiKey=${API_KEY}&ip=${ip}`;

        // Fetch data from ipgeolocation.io
        const response = await axios.get(apiUrl);
        const location = response.data;
        console.log('API Response:', location);

        if (!location || !location.country_code2) {
            console.error('Invalid response from ipgeolocation.io:', location);
            return res.status(500).json({ error: 'Error fetching location data' });
        }

        const countryCode = location.country_code2;
        const countryName = location.country_name;
        let message = '';

        if (countryCode === 'IN') {
            message = 'You are viewing from India.';
        } else if (countryCode === 'US') {
            message = 'Hello World.';
        } else {
            message = `Hello ${countryName}.`;
        }

        // Update MongoDB access count
        try {
            const result = await Location.findOneAndUpdate(
                { country: countryCode },
                { $inc: { count: 1 } },
                { upsert: true, new: true }
            );

            console.log('Access count updated:', result);
            res.json({ message });
        } catch (dbErr) {
            console.error('Error updating access count:', dbErr);
            return next(dbErr);
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
