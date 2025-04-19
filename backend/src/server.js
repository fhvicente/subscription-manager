const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const webhookRoutes = require('./routes/webhookRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rotas de webhook precisam vir antes do middleware express.json()
app.use('/webhook', webhookRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 