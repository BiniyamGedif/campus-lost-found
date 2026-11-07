// models/Item.js
// Mongoose schema for Lost and Found reports.
// A single collection ("items") stores both lost and found reports,
// distinguished by the reportType field.

const mongoose = require('mongoose');

// Approved item categories (must match the project specification).
const CATEGORIES = [
  'Electronics',
  'Bags',
  'Clothing',
  'Books & Stationery',
  'IDs & Documents',
  'Accessories',
  'Keys',
  'Other',
];

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters'],
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: 'Invalid category',
      },
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    dateOfIncident: {
      type: Date,
      required: [true, 'Incident date is required'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    reportType: {
      type: String,
      required: [true, 'Report type is required'],
      enum: {
        values: ['lost', 'found'],
        message: 'Report type must be lost or found',
      },
    },
    status: {
      type: String,
      enum: ['active', 'recovered'],
      default: 'active',
    },
    // Contact details explicitly provided by the reporter (public by design).
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    // Reference to the user who owns this report.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report owner is required'],
    },
  },
  {
    timestamps: true, // createdAt and updatedAt
  }
);

// Custom validation: at least one contact method must be provided.
itemSchema.pre('validate', function () {
  if (!this.contactEmail && !this.contactPhone) {
    this.invalidate('contactEmail', 'At least one contact method (email or phone) is required');
  }
});

// Indexes to support filtering, searching, and ownership lookups.
itemSchema.index({ user: 1 });
itemSchema.index({ reportType: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ location: 1 });
itemSchema.index({ name: 'text', description: 'text' }); // text search

// Export both the model and the categories list for reuse in validation/frontend.
module.exports = mongoose.model('Item', itemSchema);
module.exports.CATEGORIES = CATEGORIES;
