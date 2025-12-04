require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const salesRoutes = require('./routes/sales');
const productRoutes = require('./routes/products');
const commandRoutes = require('./routes/commands');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Verbal Assistant backend is running.' });
});

app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/commands', commandRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
