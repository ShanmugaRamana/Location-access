import express from 'express';
const router = express.Router();
import https from 'https';
import Location from '../models/Location.js';

const DEFAULT_IP = '24.48.0.1'; // Default IP for localhost or invalid IP cases

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

        // Use HTTPS and remove unnecessary query fields
        const apiUrl = `https://ip-api.com/json/${ip}`;

        https.get(apiUrl, (apiRes) => {
            let data = '';

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', async () => {
                try {
                    const location = JSON.parse(data);
                    console.log('API Response:', location);

                    if (location.status === 'fail') {
                        console.error('IP-API query failed:', location);
                        return res.status(500).json({ error: `Error fetching location data: ${location.message}` });
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
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    return res.status(500).json({ error: 'Error parsing location data' });
                }
            });
        }).on('error', (apiErr) => {
            console.error('Error fetching from IP-API:', apiErr);
            return res.status(500).json({ error: 'Error fetching location data' });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return next(error);
    }
});

export default router;
