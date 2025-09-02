import mongoose from 'mongoose';

export const validateObjectId = (paramName) => (req, res, next) => {
    const id = req.params[paramName] || req.body[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: `Invalid ${paramName}` });
    }
    next();
};

export const validateEndSession = (req, res, next) => {
    const { sessionId } = req.body;
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ message: 'Valid sessionId required' });
    }
    next();
};

export const validateProgressUpdate = (req, res, next) => {
    const { userId, caseId, performanceMetricsId } = req.body;
    const ids = [
        { name: 'userId', value: userId },
        { name: 'caseId', value: caseId },
        { name: 'performanceMetricsId', value: performanceMetricsId }
    ];
    
    for (const { name, value } of ids) {
        if (!value || !mongoose.Types.ObjectId.isValid(value)) {
            return res.status(400).json({ message: `Valid ${name} required` });
        }
    }
    next();
};