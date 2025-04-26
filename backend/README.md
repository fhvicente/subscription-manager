# Subscription Manager Backend

This is the simplified backend for the Subscription Manager, now using SQLite directly as a database instead of the Prisma ORM.

## Technologies Used

- **Node.js** with Express
- **SQLite** for data storage
- **JWT** for authentication
- **bcrypt** for password encryption

## Project Structure

- `/src` - Main source code
  - `/db` - SQLite database module and initialization scripts
  - `/controllers` - API controllers
  - `/routes` - API routes
  - `middleware.js` - Authentication middleware
  - `index.js` - Application entry point

## How to Use

1. Install dependencies:
   ```
   npm install
   ```

2. Create the `.env` file from the example:
   ```
   cp .env.example .env
   ```

3. Initialize the database:
   ```
   npm run init-db
   ```

4. Run the server in development mode:
   ```
   npm run dev
   ```

## Test Users

- Admin: admin@example.com / admin123
- User: user@example.com / test123

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user information (authenticated)

### Users
- `GET /api/users/profile` - Get user profile (authenticated)
- `PUT /api/users/profile` - Update user profile (authenticated)

### Subscriptions
- `GET /api/subscriptions` - List all subscriptions
- `GET /api/subscriptions/:id` - Get a specific subscription
- `POST /api/subscriptions` - Create a new subscription
- `PUT /api/subscriptions/:id` - Update a subscription
- `DELETE /api/subscriptions/:id` - Delete a subscription

## Database

The SQLite database is stored in `/data/database.sqlite`. Tables include:

- `users` - System users
- `subscriptions` - Subscriptions
- `notification_settings` - Notification settings
- `payment_logs` - Payment logs
- `todos` - To-do list 