const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      default: 'unit', // e.g., kg, liter, piece
    },
    stockQuantity: {
      type: Number,
      default: 0,
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
