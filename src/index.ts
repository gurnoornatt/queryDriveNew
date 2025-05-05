import express from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { setupDeliveryRoutes } from './routes/deliveryRoutes';
import { setupWebhookRoutes } from './routes/webhookRoutes';
import { setupRestaurantRoutes } from './routes/restaurantRoutes';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
setupDeliveryRoutes(app);
setupWebhookRoutes(app);
setupRestaurantRoutes(app);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.info(`Server running on port ${port}`);
});
