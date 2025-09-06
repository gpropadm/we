const Queue = require('bull');
// const redis = require('redis');
const redis = require('./redis-mock'); // Mock para demonstração

// Configuração Redis
const redisConfig = {
  redis: {
    port: 6379,
    host: 'localhost',
  }
};

// Filas
const messageQueue = new Queue('message processing', redisConfig);
const campaignQueue = new Queue('campaign processing', redisConfig);

// Configuração de rate limiting
const MESSAGES_PER_SECOND = parseInt(process.env.MESSAGES_PER_SECOND) || 200;
const RATE_LIMIT_DELAY = 1000 / MESSAGES_PER_SECOND; // delay entre mensagens

// Processar mensagens individuais
messageQueue.process('send-message', 10, async (job) => {
  const { phoneNumber, message, campaignId } = job.data;
  
  try {
    const whatsappService = require('./whatsapp');
    const result = await whatsappService.sendMessage(phoneNumber, message);
    
    // Salvar resultado no banco/cache
    await updateMessageStatus(campaignId, phoneNumber, 'sent', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Erro ao enviar mensagem para ${phoneNumber}:`, error.message);
    
    // Marcar como falhou
    await updateMessageStatus(campaignId, phoneNumber, 'failed', null, error.message);
    
    throw error;
  }
});

// Processar campanhas
campaignQueue.process('process-campaign', async (job) => {
  const { campaignId, contacts, message } = job.data;
  
  console.log(`📤 Processando campanha ${campaignId} para ${contacts.length} contatos`);
  
  // Adicionar mensagens na fila com delay
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const delay = i * RATE_LIMIT_DELAY;
    
    await messageQueue.add('send-message', {
      phoneNumber: contact.phone,
      message: personalizeMessage(message, contact),
      campaignId
    }, {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }
  
  console.log(`✅ Campanha ${campaignId} adicionada na fila. Tempo estimado: ${Math.ceil(contacts.length * RATE_LIMIT_DELAY / 1000 / 60)} minutos`);
});

// Personalizar mensagem com dados do contato
function personalizeMessage(template, contact) {
  return template
    .replace(/\{nome\}/g, contact.name || 'Cliente')
    .replace(/\{telefone\}/g, contact.phone)
    .replace(/\{email\}/g, contact.email || '');
}

// Atualizar status da mensagem
async function updateMessageStatus(campaignId, phoneNumber, status, messageId = null, error = null) {
  const client = redis.createClient();
  await client.connect();
  
  const key = `campaign:${campaignId}:messages`;
  const messageData = {
    phone: phoneNumber,
    status,
    messageId,
    error,
    timestamp: new Date().toISOString()
  };
  
  await client.hSet(key, phoneNumber, JSON.stringify(messageData));
  await client.disconnect();
}

// Estatísticas da fila
messageQueue.on('completed', (job, result) => {
  console.log(`✅ Mensagem enviada: ${job.data.phoneNumber}`);
});

messageQueue.on('failed', (job, err) => {
  console.log(`❌ Falha no envio: ${job.data.phoneNumber} - ${err.message}`);
});

module.exports = {
  messageQueue,
  campaignQueue,
  getQueueStats: async () => {
    const waiting = await messageQueue.getWaiting();
    const active = await messageQueue.getActive();
    const completed = await messageQueue.getCompleted();
    const failed = await messageQueue.getFailed();
    
    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  }
};