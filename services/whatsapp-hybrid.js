// Serviço híbrido: WhatsApp Business API + Evolution API
const evolutionAPI = require('./evolution-api');
const originalWhatsApp = require('./whatsapp');

class HybridWhatsAppService {
  constructor() {
    // Configurar qual provedor usar
    this.provider = process.env.WHATSAPP_PROVIDER || 'evolution'; // 'evolution' ou 'business'
    this.evolutionEnabled = process.env.EVOLUTION_ENABLED !== 'false';
  }

  // Método principal para envio
  async sendMessage(phoneNumber, messageText) {
    try {
      // Decidir qual provedor usar
      if (this.evolutionEnabled && this.provider === 'evolution') {
        return await this.sendViaEvolution(phoneNumber, messageText);
      } else {
        return await this.sendViaBusinessAPI(phoneNumber, messageText);
      }
    } catch (error) {
      console.error(`❌ Erro no envio (${this.provider}):`, error.message);
      
      // Fallback: tentar o outro provedor
      try {
        if (this.provider === 'evolution') {
          console.log('🔄 Tentando fallback para Business API...');
          return await this.sendViaBusinessAPI(phoneNumber, messageText);
        } else {
          console.log('🔄 Tentando fallback para Evolution API...');
          return await this.sendViaEvolution(phoneNumber, messageText);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError.message);
        throw error; // Lança o erro original
      }
    }
  }

  // Envio via Evolution API
  async sendViaEvolution(phoneNumber, messageText) {
    console.log(`📱 [EVOLUTION] Enviando para ${phoneNumber}`);
    return await evolutionAPI.sendTextMessage(phoneNumber, messageText);
  }

  // Envio via WhatsApp Business API
  async sendViaBusinessAPI(phoneNumber, messageText) {
    console.log(`📱 [BUSINESS] Enviando para ${phoneNumber}`);
    return await originalWhatsApp.sendMessage(phoneNumber, messageText);
  }

  // Enviar mídia (apenas Evolution por enquanto)
  async sendMediaMessage(phoneNumber, mediaUrl, caption) {
    if (this.provider === 'evolution') {
      return await evolutionAPI.sendMediaMessage(phoneNumber, mediaUrl, caption);
    } else {
      throw new Error('Envio de mídia disponível apenas via Evolution API');
    }
  }

  // Configurar instância Evolution
  async setupEvolutionInstance() {
    if (this.provider === 'evolution') {
      try {
        console.log('🔧 Configurando instância Evolution API...');
        
        // Criar instância
        await evolutionAPI.createInstance();
        
        // Obter QR Code
        const qrData = await evolutionAPI.getQRCode();
        console.log('📱 QR Code gerado! Escaneie com WhatsApp');
        
        // Verificar status
        const status = await evolutionAPI.getInstanceStatus();
        console.log('📊 Status da instância:', status);
        
        return {
          success: true,
          qrCode: qrData.qrcode,
          status: status
        };
        
      } catch (error) {
        console.error('❌ Erro ao configurar Evolution:', error.message);
        throw error;
      }
    }
  }

  // Obter informações da conta
  async getAccountInfo() {
    if (this.provider === 'evolution') {
      return await evolutionAPI.getAccountInfo();
    } else {
      return {
        provider: 'business',
        status: 'configured'
      };
    }
  }

  // Status do serviço
  async getServiceStatus() {
    const status = {
      provider: this.provider,
      evolutionEnabled: this.evolutionEnabled,
      timestamp: new Date().toISOString()
    };

    // Testar Evolution se habilitado
    if (this.evolutionEnabled) {
      try {
        const evolutionStatus = await evolutionAPI.getInstanceStatus();
        status.evolution = {
          available: true,
          instance: evolutionStatus.instance?.status || 'unknown'
        };
      } catch (error) {
        status.evolution = {
          available: false,
          error: error.message
        };
      }
    }

    // Testar Business API se configurado
    const businessConfigured = 
      process.env.WHATSAPP_ACCESS_TOKEN && 
      process.env.WHATSAPP_ACCESS_TOKEN !== 'seu_access_token_aqui';

    status.business = {
      configured: businessConfigured,
      available: businessConfigured
    };

    return status;
  }

  // Alternar provedor
  switchProvider(newProvider) {
    if (['evolution', 'business'].includes(newProvider)) {
      this.provider = newProvider;
      console.log(`🔄 Provedor alterado para: ${newProvider}`);
      return true;
    }
    return false;
  }

  // Métodos de compatibilidade
  cleanPhoneNumber(phone) {
    return evolutionAPI.cleanPhoneNumber(phone);
  }

  isValidPhoneNumber(phone) {
    return evolutionAPI.isValidPhoneNumber(phone);
  }

  // Estatísticas do provedor
  getProviderStats() {
    return {
      current: this.provider,
      evolution: this.evolutionEnabled,
      fallback: true
    };
  }
}

module.exports = new HybridWhatsAppService();