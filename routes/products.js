const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// POST /api/products - create a new product
// Body: { name, unit, stockQuantity, pricePerUnit, lowStockThreshold }
router.post('/', async (req, res) => {
  try {
    const { name, unit, stockQuantity, pricePerUnit, lowStockThreshold } = req.body;

    if (!name || !pricePerUnit) {
      return res.status(400).json({ message: 'name and pricePerUnit are required' });
    }

    const product = await Product.create({
      name,
      unit,
      stockQuantity,
      pricePerUnit,
      lowStockThreshold,
    });

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products - list all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/low-stock - list products below threshold
router.get('/low-stock', async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching low stock products:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
