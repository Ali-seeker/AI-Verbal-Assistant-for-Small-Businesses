const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

const router = express.Router();

// POST /api/sales - record a new sale
// Body: { productId, quantity, customerName }
// totalPrice is calculated automatically: quantity * product.pricePerUnit
router.post('/', async (req, res) => {
  try {
    const { productId, quantity, customerName } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ message: 'productId and quantity are required' });
    }

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const numericQty = Number(quantity);
    if (Number.isNaN(numericQty) || numericQty <= 0) {
      return res.status(400).json({ message: 'quantity must be a positive number' });
    }

    if (product.stockQuantity < numericQty) {
      return res.status(400).json({ message: 'Not enough stock for this product' });
    }

    const totalPrice = product.pricePerUnit * numericQty;

    // Create sale
    const sale = await Sale.create({
      product: productId,
      quantity: numericQty,
      totalPrice,
      customerName,
    });

    // Decrease stock
    product.stockQuantity -= numericQty;
    await product.save();

    res.status(201).json({ message: 'Sale recorded successfully', sale });
  } catch (error) {
    console.error('Error recording sale:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/sales/today - get today sales summary
router.get('/today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).populate('product');

    const totalEarned = sales.reduce((sum, s) => sum + s.totalPrice, 0);

    res.json({
      count: sales.length,
      totalEarned,
      sales,
    });
  } catch (error) {
    console.error('Error fetching today sales:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
