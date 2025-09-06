const express = require('express');
const { getQueueStats } = require('../services/queue-simple');
// const redis = require('redis');
const redis = require('../services/redis-mock'); // Mock para demonstração

const router = express.Router();

// Estatísticas gerais do dashboard
router.get('/stats', async (req, res) => {
  try {
    const queueStats = await getQueueStats();
    const campaigns = await getAllCampaigns();
    
    const stats = {
      queue: queueStats,
      campaigns: {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'processing').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        scheduled: campaigns.filter(c => c.status === 'scheduled').length,
        paused: campaigns.filter(c => c.status === 'paused').length
      },
      messages: await getMessageStats(),
      system: {
        messagesPerSecond: process.env.MESSAGES_PER_SECOND || 200,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };

    res.json(stats);

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Histórico de envios (últimas 24h)
router.get('/history', async (req, res) => {
  try {
    const history = await getMessageHistory();
    res.json({ history });

  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ error: error.message });
  }
});

// Status em tempo real
router.get('/realtime', async (req, res) => {
  try {
    const queueStats = await getQueueStats();
    const activeJobs = await getActiveJobs();
    
    res.json({
      queueStats,
      activeJobs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao obter status em tempo real:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logs do sistema
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await getSystemLogs(limit);
    
    res.json({ logs });

  } catch (error) {
    console.error('Erro ao obter logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Funções auxiliares

async function getAllCampaigns() {
  const client = redis.createClient();
  await client.connect();
  
  const campaignData = await client.hGetAll('campaigns');
  await client.disconnect();
  
  return Object.values(campaignData).map(data => JSON.parse(data));
}

async function getMessageStats() {
  const client = redis.createClient();
  await client.connect();
  
  // Buscar todas as chaves de mensagens de campanha
  const keys = await client.keys('campaign:*:messages');
  
  let totalSent = 0;
  let totalFailed = 0;
  let totalPending = 0;
  
  for (const key of keys) {
    const messages = await client.hGetAll(key);
    const messageList = Object.values(messages).map(data => JSON.parse(data));
    
    totalSent += messageList.filter(m => m.status === 'sent').length;
    totalFailed += messageList.filter(m => m.status === 'failed').length;
    totalPending += messageList.filter(m => m.status === 'pending').length;
  }
  
  await client.disconnect();
  
  const total = totalSent + totalFailed + totalPending;
  
  return {
    total,
    sent: totalSent,
    failed: totalFailed,
    pending: totalPending,
    successRate: total > 0 ? ((totalSent / total) * 100).toFixed(2) : 0
  };
}

async function getMessageHistory() {
  const client = redis.createClient();
  await client.connect();
  
  // Buscar histórico das últimas 24 horas
  const historyKey = 'message_history';
  const history = await client.lRange(historyKey, 0, -1);
  
  await client.disconnect();
  
  return history.map(item => JSON.parse(item)).reverse();
}

async function getActiveJobs() {
  const { messageQueue } = require('../services/queue');
  
  const activeJobs = await messageQueue.getActive();
  
  return activeJobs.map(job => ({
    id: job.id,
    data: job.data,
    progress: job.progress(),
    timestamp: job.timestamp
  }));
}

async function getSystemLogs(limit) {
  const client = redis.createClient();
  await client.connect();
  
  const logs = await client.lRange('system_logs', 0, limit - 1);
  await client.disconnect();
  
  return logs.map(log => JSON.parse(log)).reverse();
}

// Middleware para adicionar log ao sistema
async function addSystemLog(level, message, data = null) {
  const client = redis.createClient();
  await client.connect();
  
  const logEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  await client.lPush('system_logs', JSON.stringify(logEntry));
  await client.lTrim('system_logs', 0, 999); // Manter apenas 1000 logs
  
  await client.disconnect();
}

module.exports = router;