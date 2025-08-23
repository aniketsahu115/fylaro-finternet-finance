const mongoose = require('mongoose');
const User = require('./User');
const Invoice = require('./Invoice');
const Order = require('./Order');
const Payment = require('./Payment');
const Document = require('./Document');
const CreditScore = require('./CreditScore');

// Database connection with enhanced configuration
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fylaro-finance', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Set up database event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    // For development environment, allow app to continue without database
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Database connection failed but continuing in development mode with limited functionality');
      console.error('Database error details:', error.message);
      return null;
    }
    
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});

module.exports = {
  connectDB,
  User,
  Invoice,
  Order,
  Payment,
  Document,
  CreditScore,
  mongoose
};
