// Sistema de fila simplificado para demonstração (sem Redis)
const whatsappService = require('./whatsapp-hybrid');

class SimpleQueue {
  constructor() {
    this.messageQueue = [];
    this.processing = false;
    this.stats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0
    };
  }

  // Adicionar mensagem na fila
  async addMessage(campaignId, phoneNumber, message) {
    const job = {
      id: Date.now() + Math.random(),
      campaignId,
      phoneNumber,
      message,
      status: 'waiting',
      createdAt: new Date()
    };

    this.messageQueue.push(job);
    this.stats.waiting++;
    
    if (!this.processing) {
      this.processQueue();
    }
    
    return job;
  }

  // Processar campanha (adicionar todas as mensagens na fila)
  async processCampaign(campaignId, contacts, message) {
    console.log(`🎯 Processando campanha ${campaignId} para ${contacts.length} contatos`);
    
    const MESSAGES_PER_SECOND = 5; // Reduzido para demonstração
    const delay = 1000 / MESSAGES_PER_SECOND;
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const personalizedMessage = this.personalizeMessage(message, contact);
      
      setTimeout(() => {
        this.addMessage(campaignId, contact.phone, personalizedMessage);
      }, i * delay);
    }
    
    return { success: true };
  }

  // Processar fila de mensagens
  async processQueue() {
    if (this.processing || this.messageQueue.length === 0) {
      return;
    }

    this.processing = true;
    
    while (this.messageQueue.length > 0) {
      const job = this.messageQueue.shift();
      this.stats.waiting--;
      this.stats.active++;
      
      job.status = 'processing';
      
      try {
        console.log(`📱 Processando: ${job.phoneNumber}`);
        
        const result = await whatsappService.sendMessage(job.phoneNumber, job.message);
        
        job.status = 'completed';
        job.result = result;
        this.stats.active--;
        this.stats.completed++;
        
        // Salvar resultado
        await this.saveMessageResult(job.campaignId, job.phoneNumber, 'sent', result.messageId);
        
      } catch (error) {
        console.error(`❌ Erro: ${job.phoneNumber} - ${error.message}`);
        
        job.status = 'failed';
        job.error = error.message;
        this.stats.active--;
        this.stats.failed++;
        
        // Salvar falha
        await this.saveMessageResult(job.campaignId, job.phoneNumber, 'failed', null, error.message);
      }
      
      // Delay entre mensagens
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    this.processing = false;
  }

  // Personalizar mensagem
  personalizeMessage(template, contact) {
    return template
      .replace(/\{nome\}/g, contact.name || 'Cliente')
      .replace(/\{telefone\}/g, contact.phone)
      .replace(/\{email\}/g, contact.email || '');
  }

  // Salvar resultado da mensagem
  async saveMessageResult(campaignId, phoneNumber, status, messageId = null, error = null) {
    const redis = require('./redis-mock');
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

  // Obter estatísticas
  getStats() {
    return {
      ...this.stats,
      total: this.stats.waiting + this.stats.active + this.stats.completed + this.stats.failed
    };
  }
}

// Instância global
const simpleQueue = new SimpleQueue();

module.exports = {
  messageQueue: simpleQueue,
  campaignQueue: simpleQueue,
  getQueueStats: () => simpleQueue.getStats()
};