const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const campaignRoutes = require('./routes/campaigns');
const contactRoutes = require('./routes/contacts');
const dashboardRoutes = require('./routes/dashboard');
const evolutionRoutes = require('./routes/evolution');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use(limiter);

// Rotas
app.use('/api/campaigns', campaignRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/evolution', evolutionRoutes);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});