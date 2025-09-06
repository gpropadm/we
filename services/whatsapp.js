const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  async sendMessage(phoneNumber, messageText) {
    try {
      // Limpar número (remover caracteres especiais)
      const cleanPhone = this.cleanPhoneNumber(phoneNumber);
      
      // MODO DEMONSTRAÇÃO - simular envio
      if (!this.accessToken || this.accessToken === 'seu_access_token_aqui') {
        console.log(`📱 [DEMO] Enviando para ${cleanPhone}: ${messageText}`);
        
        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        // Simular falha ocasional (5%)
        if (Math.random() < 0.05) {
          throw new Error('Simulação de falha na API');
        }
        
        return {
          success: true,
          messageId: 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          phone: cleanPhone
        };
      }
      
      // MODO PRODUÇÃO - envio real
      const messageData = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: {
          body: messageText
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        phone: cleanPhone
      };

    } catch (error) {
      console.error('Erro no envio WhatsApp:', error.response?.data || error.message);
      
      throw new Error(
        error.response?.data?.error?.message || 
        'Erro no envio da mensagem'
      );
    }
  }

  // Enviar mensagem com template aprovado
  async sendTemplateMessage(phoneNumber, templateName, parameters = []) {
    try {
      const cleanPhone = this.cleanPhoneNumber(phoneNumber);
      
      const messageData = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "pt_BR"
          },
          components: parameters.length > 0 ? [{
            type: "body",
            parameters: parameters.map(param => ({
              type: "text",
              text: param
            }))
          }] : []
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        phone: cleanPhone
      };

    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || 
        'Erro no envio do template'
      );
    }
  }

  // Verificar status da mensagem
  async getMessageStatus(messageId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error('Erro ao verificar status da mensagem');
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
    
    return cleaned;
  }

  // Verificar se número é válido
  isValidPhoneNumber(phone) {
    const cleaned = this.cleanPhoneNumber(phone);
    return cleaned.length >= 12 && cleaned.length <= 15;
  }
}

module.exports = new WhatsAppService();