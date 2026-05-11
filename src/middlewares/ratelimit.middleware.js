const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 5,                   
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // hanya hitung request yang GAGAL

    handler: (req, res) => {
        const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000);
        return res.status(429).json({
            error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
            retryAfterSeconds: retryAfter,
        });
    }
});

module.exports = { loginLimiter };