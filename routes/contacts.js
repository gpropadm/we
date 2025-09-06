const express = require('express');
const whatsappService = require('../services/whatsapp-hybrid');

const router = express.Router();

// Validar número de telefone
router.post('/validate', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Número de telefone é obrigatório' });
    }

    const isValid = whatsappService.isValidPhoneNumber(phone);
    const cleanPhone = whatsappService.cleanPhoneNumber(phone);

    res.json({
      isValid,
      originalPhone: phone,
      cleanPhone,
      formatted: formatPhoneNumber(cleanPhone)
    });

  } catch (error) {
    console.error('Erro ao validar telefone:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensagem de teste
router.post('/test', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ 
        error: 'Número de telefone e mensagem são obrigatórios' 
      });
    }

    const result = await whatsappService.sendMessage(phone, message);
    
    res.json({
      success: true,
      messageId: result.messageId,
      phone: result.phone,
      message: 'Mensagem de teste enviada com sucesso!'
    });

  } catch (error) {
    console.error('Erro no teste de mensagem:', error);
    res.status(500).json({ 
      error: 'Erro ao enviar mensagem de teste: ' + error.message 
    });
  }
});

// Validar lista de contatos
router.post('/validate-batch', async (req, res) => {
  try {
    const { contacts } = req.body;
    
    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ 
        error: 'Lista de contatos é obrigatória' 
      });
    }

    const results = contacts.map(contact => {
      const isValid = whatsappService.isValidPhoneNumber(contact.phone);
      const cleanPhone = whatsappService.cleanPhoneNumber(contact.phone);
      
      return {
        ...contact,
        isValid,
        cleanPhone,
        formatted: formatPhoneNumber(cleanPhone),
        originalPhone: contact.phone
      };
    });

    const validContacts = results.filter(c => c.isValid);
    const invalidContacts = results.filter(c => !c.isValid);

    res.json({
      total: contacts.length,
      valid: validContacts.length,
      invalid: invalidContacts.length,
      validContacts,
      invalidContacts: invalidContacts.map(c => ({
        phone: c.originalPhone,
        name: c.name,
        reason: 'Formato de telefone inválido'
      }))
    });

  } catch (error) {
    console.error('Erro ao validar contatos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter template de CSV para upload
router.get('/csv-template', (req, res) => {
  const csvTemplate = 'nome,telefone,email\n' +
                     'João Silva,11999999999,joao@email.com\n' +
                     'Maria Santos,21888888888,maria@email.com\n' +
                     'Pedro Oliveira,11777777777,pedro@email.com';
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="template-contatos.csv"');
  res.send(csvTemplate);
});

// Função para formatar número de telefone
function formatPhoneNumber(phone) {
  if (phone.length === 13 && phone.startsWith('55')) {
    // Formato: +55 (11) 99999-9999
    const country = phone.substring(0, 2);
    const area = phone.substring(2, 4);
    const number1 = phone.substring(4, 9);
    const number2 = phone.substring(9);
    
    return `+${country} (${area}) ${number1}-${number2}`;
  }
  
  return phone;
}

module.exports = router;