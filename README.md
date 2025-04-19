# Subscription Manager

A simple and effective tool to manage your subscriptions and save money.

## Technology Stack

- **Backend**: Node.js, Express, Prisma ORM, SQLite
- **Frontend**: Next.js, React, TailwindCSS
- **Authentication**: Custom JWT-based authentication
- **Email Notifications**: SendGrid
- **Payments**: Stripe

## Features

- User authentication with JWT
- Subscription management
- Subscription renewal notifications
- Payment processing
- Usage statistics and reports

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/subscription-manager.git
   cd subscription-manager
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Set up the SQLite database:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Initialize the database with sample data:
   ```bash
   node scripts/init-db.js
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

6. Open a new terminal and install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

7. Start the frontend development server:
   ```bash
   npm run dev
   ```

8. Access the application at [http://localhost:3000](http://localhost:3000)

### Sample Accounts

After initializing the database, you can use these accounts to test the application:

- Admin: admin@example.com / admin123
- User: user@example.com / test123

## Development

### Backend

The backend is an Express.js application with a RESTful API structure using the following main components:

- **Prisma**: ORM for database interactions
- **JWT**: Authentication mechanism
- **Express**: Web framework
- **SQLite**: Database

### Frontend

The frontend is a Next.js application using:

- **React**: UI library
- **TailwindCSS**: Styling
- **Axios**: API requests
- **React Hook Form**: Form handling and validation

## API Documentation

See the [API.md](API.md) file for detailed API documentation.

## Deployment

See the [deployment.md](deployment.md) file for deployment instructions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
