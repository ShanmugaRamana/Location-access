import express from 'express';
const router = express.Router();
import http from 'http';
import Location from '../models/Location.js';

router.get('/', async (req, res) => {
  try {
    // Get user's IP address (or use a default for testing)
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '24.48.0.1'; // Add default IP
    console.log(`User IP: ${ip}`);

    // Handle IPv6 loopback address (::1)
    if (ip === '::1') {
      ip = '24.48.0.1'; // Use the default IP when the user is in the local host
      console.log('Using default IP for localhost.');
    }

    // Fetch location data using ip-api.com
    const apiUrl = `http://ip-api.com/json/${ip}?fields=status,countryCode,country`;

    http.get(apiUrl, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', async () => {
        try {
          const location = JSON.parse(data);

          if (location.status !== 'success') {
            console.error('IP-API query failed:', location); // Log the entire response
            const errorMessage = location.message || 'Unknown error from IP-API'; // Get more specific information
            return res.status(500).json({ error: `Error fetching location data: ${errorMessage}` });
          }

          const countryCode = location.countryCode;
          const countryName = location.country;

          let message = '';
          if (countryCode === 'IN') {
            message = 'You are viewing from India.';
          } else if (countryCode === 'US') {
            message = 'Hello World.';
          } else {
            message = `Hello ${countryName}.`;
          }

          // Update access count in MongoDB
          try {
            const filter = { country: countryCode };
            const update = { $inc: { count: 1 } };
            const options = { upsert: true, new: true, setDefaultsOnInsert: true };

            const result = await Location.findOneAndUpdate(filter, update, options);
            console.log('Access count updated:', result);
          } catch (err) {
            console.error('Error updating access count:', err);
          }

          res.json({ message });
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          res.status(500).json({ error: 'Error parsing location data' });
        }
      });
    }).on('error', (err) => {
      console.error('Error fetching from IP-API:', err);
      res.status(500).json({ error: 'Error fetching location data' });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
