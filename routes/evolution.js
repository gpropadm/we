const express = require('express');
const whatsappService = require('../services/whatsapp-hybrid');

const router = express.Router();

// Status da Evolution API
router.get('/status', async (req, res) => {
  try {
    const status = await whatsappService.getServiceStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Erro ao obter status Evolution:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Configurar instância WhatsApp
router.post('/setup', async (req, res) => {
  try {
    const result = await whatsappService.setupEvolutionInstance();
    
    res.json({
      success: true,
      message: 'Instância configurada. Escaneie o QR Code com WhatsApp',
      qrCode: result.qrCode,
      status: result.status
    });
    
  } catch (error) {
    console.error('Erro ao configurar Evolution:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Obter informações da conta
router.get('/account', async (req, res) => {
  try {
    const accountInfo = await whatsappService.getAccountInfo();
    
    res.json({
      success: true,
      account: accountInfo
    });
    
  } catch (error) {
    console.error('Erro ao obter info da conta:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Alternar provedor
router.post('/switch-provider', async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider || !['evolution', 'business'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Provedor inválido. Use: evolution ou business'
      });
    }
    
    const switched = whatsappService.switchProvider(provider);
    
    if (switched) {
      res.json({
        success: true,
        message: `Provedor alterado para: ${provider}`,
        currentProvider: provider
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Erro ao alterar provedor'
      });
    }
    
  } catch (error) {
    console.error('Erro ao alterar provedor:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Enviar mensagem de teste via Evolution
router.post('/test-message', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Telefone e mensagem são obrigatórios'
      });
    }
    
    const result = await whatsappService.sendMessage(phone, message);
    
    res.json({
      success: true,
      message: 'Mensagem enviada via Evolution API',
      result
    });
    
  } catch (error) {
    console.error('Erro no teste Evolution:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Estatísticas do provedor
router.get('/provider-stats', async (req, res) => {
  try {
    const stats = whatsappService.getProviderStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Erro ao obter stats do provedor:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// QR Code para conectar WhatsApp
router.get('/qrcode', async (req, res) => {
  try {
    const evolutionAPI = require('../services/evolution-api');
    const qrData = await evolutionAPI.getQRCode();
    
    res.json({
      success: true,
      qrcode: qrData.qrcode,
      message: 'Escaneie este QR Code com seu WhatsApp'
    });
    
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;