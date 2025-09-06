const axios = require('axios');

class EvolutionAPI {
  constructor() {
    // Configurações da Evolution API
    this.baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    this.apiKey = process.env.EVOLUTION_API_KEY || 'mude-me';
    this.instanceName = process.env.EVOLUTION_INSTANCE || 'bulk_sender';
  }

  // Headers padrão para requisições
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey
    };
  }

  // Criar instância do WhatsApp
  async createInstance() {
    try {
      const response = await axios.post(`${this.baseURL}/instance/create`, {
        instanceName: this.instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      }, {
        headers: this.getHeaders()
      });

      console.log('✅ Instância criada:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error.response?.data || error.message);
      
      // Se em modo demo, simula criação
      if (this.baseURL.includes('localhost:8080')) {
        console.log('📱 [DEMO] Simulando criação de instância...');
        return {
          instance: {
            instanceName: this.instanceName,
            status: 'created'
          }
        };
      }
      
      throw error;
    }
  }

  // Obter QR Code para conectar WhatsApp
  async getQRCode() {
    try {
      const response = await axios.get(`${this.baseURL}/instance/qrcode/${this.instanceName}`, {
        headers: this.getHeaders()
      });

      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao obter QR Code:', error.response?.data || error.message);
      
      // Se em modo demo, simula QR Code
      if (this.baseURL.includes('localhost:8080')) {
        console.log('📱 [DEMO] QR Code seria mostrado aqui');
        return {
          qrcode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg=='
        };
      }
      
      throw error;
    }
  }

  // Verificar status da instância
  async getInstanceStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/instance/status/${this.instanceName}`, {
        headers: this.getHeaders()
      });

      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error.response?.data || error.message);
      
      // Se em modo demo, simula status
      if (this.baseURL.includes('localhost:8080')) {
        return {
          instance: {
            instanceName: this.instanceName,
            status: 'connected'
          }
        };
      }
      
      throw error;
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(phoneNumber, message) {
    try {
      // Limpar e formatar número
      const cleanPhone = this.cleanPhoneNumber(phoneNumber);
      
      const payload = {
        number: cleanPhone,
        text: message
      };

      const response = await axios.post(
        `${this.baseURL}/message/sendText/${this.instanceName}`,
        payload,
        { headers: this.getHeaders() }
      );

      console.log(`📱 Enviado para ${cleanPhone}: ${message}`);
      
      return {
        success: true,
        messageId: response.data.messageId || 'evo_' + Date.now(),
        phone: cleanPhone,
        status: 'sent'
      };

    } catch (error) {
      console.error('❌ Erro no envio Evolution API:', error.response?.data || error.message);
      
      // Se em modo demo, simula envio
      if (this.baseURL.includes('localhost:8080')) {
        const cleanPhone = this.cleanPhoneNumber(phoneNumber);
        console.log(`📱 [DEMO EVOLUTION] Enviando para ${cleanPhone}: ${message}`);
        
        // Simular delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));
        
        // Simular falha ocasional (3%)
        if (Math.random() < 0.03) {
          throw new Error('Simulação de falha na Evolution API');
        }
        
        return {
          success: true,
          messageId: 'evo_demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          phone: cleanPhone,
          status: 'sent'
        };
      }
      
      throw error;
    }
  }

  // Enviar mensagem com mídia
  async sendMediaMessage(phoneNumber, mediaUrl, caption = '') {
    try {
      const cleanPhone = this.cleanPhoneNumber(phoneNumber);
      
      const payload = {
        number: cleanPhone,
        mediaMessage: {
          mediatype: 'image', // ou 'video', 'audio', 'document'
          media: mediaUrl,
          caption: caption
        }
      };

      const response = await axios.post(
        `${this.baseURL}/message/sendMedia/${this.instanceName}`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        messageId: response.data.messageId,
        phone: cleanPhone
      };

    } catch (error) {
      console.error('❌ Erro no envio de mídia:', error.response?.data || error.message);
      throw error;
    }
  }

  // Limpar número de telefone
  cleanPhoneNumber(phone) {
    // Remove tudo exceto números
    let cleaned = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      cleaned = '55' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '5511' + cleaned;
    } else if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    // Formato para Evolution API: 5511999999999
    return cleaned;
  }

  // Verificar se número é válido
  isValidPhoneNumber(phone) {
    const cleaned = this.cleanPhoneNumber(phone);
    return cleaned.length >= 12 && cleaned.length <= 15;
  }

  // Obter informações da conta WhatsApp
  async getAccountInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/instance/me/${this.instanceName}`, {
        headers: this.getHeaders()
      });

      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao obter info da conta:', error.response?.data || error.message);
      
      // Se em modo demo
      if (this.baseURL.includes('localhost:8080')) {
        return {
          user: {
            id: '5511999999999@c.us',
            name: 'Bulk Sender Demo',
            status: 'connected'
          }
        };
      }
      
      throw error;
    }
  }

  // Webhook para receber status de mensagens
  setupWebhook(webhookUrl) {
    // Configurar webhook para receber updates
    return axios.post(`${this.baseURL}/webhook/set/${this.instanceName}`, {
      webhook: {
        url: webhookUrl,
        events: ['message', 'send_message', 'message_ack']
      }
    }, {
      headers: this.getHeaders()
    });
  }
}

module.exports = new EvolutionAPI();