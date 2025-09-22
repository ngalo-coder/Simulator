import mongoose from 'mongoose';

const specialtySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // Single program area - either 'basic' or 'specialty'
    programArea: {
        type: String,
        required: true,
        enum: ['basic', 'specialty'],
        default: 'basic'
    },
    description: {
        type: String,
        default: ''
    },
    active: {
        type: Boolean,
        default: true
    },
    // Specialty visibility management fields
    isVisible: {
        type: Boolean,
        default: true
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    modifiedBy: {
        type: String,
        default: 'system'
    }
}, {
    timestamps: true
});

const Specialty = mongoose.model('Specialty', specialtySchema);

export default Specialty;