import rateLimit from 'express-rate-limit';

export const endSessionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { message: 'Too many session end requests' },
    standardHeaders: true,
    legacyHeaders: false
});

export const progressLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { message: 'Too many progress requests' },
    standardHeaders: true,
    legacyHeaders: false
});