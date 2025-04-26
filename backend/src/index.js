import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { handleWebhook } from './controllers/paymentController.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Basic configuration
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Special route for webhooks with raw body parser (must come before express.json())
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// JSON parsing middleware (after webhooks)
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Subscription Manager API' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
