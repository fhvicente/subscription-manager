import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRoutes from './routes/webhookRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rotas de webhook precisam vir antes do middleware express.json()
app.use('/webhook', webhookRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 