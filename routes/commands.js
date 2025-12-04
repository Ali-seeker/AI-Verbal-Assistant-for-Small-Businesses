const express = require('express');
const Product = require('../models/Product');
const Sale = require('../models/Sale');

const router = express.Router();

// Helper: standard help payload
function getHelpPayload() {
  return {
    success: false,
    type: 'help',
    message: 'Could not understand command. Supported examples:',
    examples: [
      'sell 2 sugar',
      'sell 2 kg sugar to Ali',
      '2 kg sugar bech di',
      'show today sales',
      'show low stock',
      'add product sugar stock 10 price 100',
      'update product sugar price 120',
      'change price sugar to 120',
    ],
  };
}

// Helper: normalise common number words (for voice input)
function normaliseNumberWords(text) {
  if (!text) return text;
  const map = {
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    for: '4', // "for" instead of "four"
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    ate: '8',
    nine: '9',
    ten: '10',
    // Common STT variants for "bech" (Urdu "sell")
    betch: 'bech',
    beech: 'bech',
    bach: 'bech',
    beige: 'bech',
  };

  let result = text;
  Object.keys(map).forEach((word) => {
    const re = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(re, map[word]);
  });
  return result;
}

// POST /api/commands/execute
// Body: { text: string }
router.post('/execute', async (req, res) => {
  const { text } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      type: 'validation',
      message: 'Command text is required',
      ...getHelpPayload(),
    });
  }

  const original = text.trim();
  const normalised = normaliseNumberWords(original);
  const lower = original.toLowerCase();
  const lowerNorm = normalised.toLowerCase();

  try {
    // 0) Update product (price / stock / low threshold)
    // Patterns:
    //   update product <name> price <price>
    //   update product <name> stock <qty>
    //   update product <name> low <threshold>
    //   change price <name> to <price>
    if (lowerNorm.startsWith('update product')) {
      // We will inspect which field user wants to update by matching specific words.
      // Price update
      let match = normalised.match(/^update product\s+(.+?)\s+price\s+(\d+(?:\.\d+)?)/i);
      if (match) {
        const name = match[1].trim();
        const priceStr = match[2];
        const pricePerUnit = Number(priceStr);
        if (Number.isNaN(pricePerUnit) || pricePerUnit <= 0) {
          return res.status(400).json({
            success: false,
            type: 'validation',
            message: 'Price per unit must be a positive number',
          });
        }

        const product = await Product.findOne({
          name: { $regex: new RegExp('^' + name + '$', 'i') },
        });

        if (!product) {
          return res.status(404).json({
            success: false,
            type: 'notFound',
            message: `Product not found for name: ${name}`,
          });
        }

        product.pricePerUnit = pricePerUnit;
        await product.save();

        return res.json({
          success: true,
          type: 'productUpdate',
          message: 'Product price updated successfully via command',
          data: { product },
        });
      }

      // Stock update
      match = normalised.match(/^update product\s+(.+?)\s+stock\s+(\d+(?:\.\d+)?)/i);
      if (match) {
        const name = match[1].trim();
        const stockStr = match[2];
        const stockQuantity = Number(stockStr);
        if (Number.isNaN(stockQuantity) || stockQuantity < 0) {
          return res.status(400).json({
            success: false,
            type: 'validation',
            message: 'Stock quantity must be a non-negative number',
          });
        }

        const product = await Product.findOne({
          name: { $regex: new RegExp('^' + name + '$', 'i') },
        });

        if (!product) {
          return res.status(404).json({
            success: false,
            type: 'notFound',
            message: `Product not found for name: ${name}`,
          });
        }

        product.stockQuantity = stockQuantity;
        await product.save();

        return res.json({
          success: true,
          type: 'productUpdate',
          message: 'Product stock updated successfully via command',
          data: { product },
        });
      }

      // Low-stock threshold update
      match = normalised.match(/^update product\s+(.+?)\s+low\s+(\d+(?:\.\d+)?)/i);
      if (match) {
        const name = match[1].trim();
        const lowStr = match[2];
        const lowStockThreshold = Number(lowStr);
        if (Number.isNaN(lowStockThreshold) || lowStockThreshold < 0) {
          return res.status(400).json({
            success: false,
            type: 'validation',
            message: 'Low stock threshold must be a non-negative number',
          });
        }

        const product = await Product.findOne({
          name: { $regex: new RegExp('^' + name + '$', 'i') },
        });

        if (!product) {
          return res.status(404).json({
            success: false,
            type: 'notFound',
            message: `Product not found for name: ${name}`,
          });
        }

        product.lowStockThreshold = lowStockThreshold;
        await product.save();

        return res.json({
          success: true,
          type: 'productUpdate',
          message: 'Product low-stock threshold updated successfully via command',
          data: { product },
        });
      }

      return res.status(400).json({
        success: false,
        type: 'parse',
        message:
          'Could not parse update product command. Use: update product <name> price <price> | stock <qty> | low <threshold>',
        ...getHelpPayload(),
      });
    }

    // Support simpler phrase: "change price <name> to <price>"
    if (lowerNorm.startsWith('change price')) {
      const match = normalised.match(/^change price\s+(.+?)\s+(?:to\s+)?(\d+(?:\.\d+)?)/i);
      if (!match) {
        return res.status(400).json({
          success: false,
          type: 'parse',
          message: 'Could not parse change price command. Use: change price <name> to <price>',
          ...getHelpPayload(),
        });
      }

      const name = match[1].trim();
      const priceStr = match[2];
      const pricePerUnit = Number(priceStr);
      if (Number.isNaN(pricePerUnit) || pricePerUnit <= 0) {
        return res.status(400).json({
          success: false,
          type: 'validation',
          message: 'Price per unit must be a positive number',
        });
      }

      const product = await Product.findOne({
        name: { $regex: new RegExp('^' + name + '$', 'i') },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          type: 'notFound',
          message: `Product not found for name: ${name}`,
        });
      }

      product.pricePerUnit = pricePerUnit;
      await product.save();

      return res.json({
        success: true,
        type: 'productUpdate',
        message: 'Product price updated successfully via command',
        data: { product },
      });
    }

    // 0) Add product via command
    // Pattern: "add product <name> stock <qty> price <price> [unit <unit>] [low <threshold>]"
    if (lowerNorm.startsWith('add product')) {
      const addRegex = /^add product\s+(.+?)\s+stock\s+(\d+(?:\.\d+)?)\s+price\s+(\d+(?:\.\d+)?)(?:\s+unit\s+(\S+))?(?:\s+low\s+(\d+(?:\.\d+)?))?$/i;
      const match = normalised.match(addRegex);

      if (!match) {
        return res.status(400).json({
          success: false,
          type: 'parse',
          message:
            'Could not parse add product command. Use: add product <name> stock <qty> price <price> [unit <unit>] [low <threshold>]',
          ...getHelpPayload(),
        });
      }

      const name = match[1].trim();
      const stockStr = match[2];
      const priceStr = match[3];
      const unit = (match[4] || 'unit').trim();
      const lowStr = match[5];

      const stockQuantity = Number(stockStr);
      const pricePerUnit = Number(priceStr);
      const lowStockThreshold = lowStr ? Number(lowStr) : 5;

      if (Number.isNaN(stockQuantity) || stockQuantity < 0) {
        return res.status(400).json({
          success: false,
          type: 'validation',
          message: 'Stock quantity must be a non-negative number',
        });
      }

      if (Number.isNaN(pricePerUnit) || pricePerUnit <= 0) {
        return res.status(400).json({
          success: false,
          type: 'validation',
          message: 'Price per unit must be a positive number',
        });
      }

      if (Number.isNaN(lowStockThreshold) || lowStockThreshold < 0) {
        return res.status(400).json({
          success: false,
          type: 'validation',
          message: 'Low stock threshold must be a non-negative number',
        });
      }

      const product = await Product.create({
        name,
        unit,
        stockQuantity,
        pricePerUnit,
        lowStockThreshold,
      });

      return res.status(201).json({
        success: true,
        type: 'productCreate',
        message: 'Product created successfully via command',
        data: { product },
      });
    }

    // 1) Today sales summary
    if ((lowerNorm.includes('today') && lowerNorm.includes('sale')) || lowerNorm.startsWith('today sales')) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const sales = await Sale.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }).populate('product');

      const totalEarned = sales.reduce((sum, s) => sum + s.totalPrice, 0);

      return res.json({
        success: true,
        type: 'summary',
        message: 'Today\'s sales summary',
        data: {
          count: sales.length,
          totalEarned,
          sales,
        },
      });
    }

    // 2) Low stock products
    if (lowerNorm.includes('low stock') || lowerNorm.includes('stock kam')) {
      const products = await Product.find({
        $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      });

      return res.json({
        success: true,
        type: 'lowStock',
        message: 'Low stock products',
        data: { products },
      });
    }

    // 3) Sell intent - simple structured pattern
    // Pattern: "sell <qty> [unit] <productName> [to <customerName>]"
    if (lowerNorm.startsWith('sell ')) {
      const sellRegex = /^sell\s+(\d+(?:\.\d+)?)\s+(?:[a-zA-Z]+\s+)?(.+?)(?:\s+to\s+(.+))?$/i;
      const match = normalised.match(sellRegex);

      if (!match) {
        return res.status(400).json({
          success: false,
          type: 'parse',
          message:
            'Could not parse sell command. Use: sell <quantity> <productName> [to <customerName>]',
          ...getHelpPayload(),
        });
      }

      const quantityStr = match[1];
      const productNameRaw = match[2];
      const customerName = match[3];

      const quantity = Number(quantityStr);
      if (Number.isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          type: 'validation',
          message: 'Quantity must be a positive number',
        });
      }

      const productName = productNameRaw.trim();

      // Find product by name (case-insensitive)
      const product = await Product.findOne({
        name: { $regex: new RegExp('^' + productName + '$', 'i') },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          type: 'notFound',
          message: `Product not found for name: ${productName}`,
        });
      }

      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          type: 'stock',
          message: 'Not enough stock for this product',
          data: {
            available: product.stockQuantity,
            requested: quantity,
          },
        });
      }

      const totalPrice = product.pricePerUnit * quantity;

      const sale = await Sale.create({
        product: product._id,
        quantity,
        totalPrice,
        customerName,
      });

      product.stockQuantity -= quantity;
      await product.save();

      return res.status(201).json({
        success: true,
        type: 'sale',
        message: 'Sale recorded successfully via command',
        data: {
          sale,
          product: {
            _id: product._id,
            name: product.name,
            remainingStock: product.stockQuantity,
            unit: product.unit,
          },
        },
      });
    }

    // 3b) Simple Urdu-style sale: "2 kg sugar bech di"
    if (/\bbech/.test(lowerNorm)) {
      const bechRegex = /^(\d+(?:\.\d+)?)\s+(?:[a-zA-Z]+\s+)?(.+?)\s+bech/i;
      const match = normalised.match(bechRegex);

      if (!match) {
        return res.status(400).json({
          success: false,
          type: 'parse',
          message:
            'Could not parse bech command. Try: 2 kg sugar bech di',
          ...getHelpPayload(),
        });
      }

      const quantityStr = match[1];
      const productNameRaw = match[2];
      const quantity = Number(quantityStr);
      if (Number.isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          type: 'validation',
          message: 'Quantity must be a positive number',
        });
      }

      const productName = productNameRaw.trim();

      const product = await Product.findOne({
        name: { $regex: new RegExp('^' + productName + '$', 'i') },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          type: 'notFound',
          message: `Product not found for name: ${productName}`,
        });
      }

      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          type: 'stock',
          message: 'Not enough stock for this product',
          data: {
            available: product.stockQuantity,
            requested: quantity,
          },
        });
      }

      const totalPrice = product.pricePerUnit * quantity;

      const sale = await Sale.create({
        product: product._id,
        quantity,
        totalPrice,
      });

      product.stockQuantity -= quantity;
      await product.save();

      return res.status(201).json({
        success: true,
        type: 'sale',
        message: 'Sale recorded successfully via command',
        data: {
          sale,
          product: {
            _id: product._id,
            name: product.name,
            remainingStock: product.stockQuantity,
            unit: product.unit,
          },
        },
      });
    }

    // 4) Unknown command -> help
    return res.status(400).json(getHelpPayload());
  } catch (error) {
    console.error('Error executing command:', error.message);
    return res.status(500).json({
      success: false,
      type: 'server',
      message: 'Server error while executing command',
    });
  }
});

module.exports = router;
