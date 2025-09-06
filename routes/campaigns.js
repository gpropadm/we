const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { campaignQueue } = require('../services/queue-simple');
// const redis = require('redis');
const redis = require('../services/redis-mock'); // Mock para demonstração

const router = express.Router();

// Configuração para upload de arquivos CSV
const upload = multer({ dest: 'uploads/' });

// Criar nova campanha
router.post('/create', upload.single('contacts'), async (req, res) => {
  try {
    const { name, message, scheduleDate } = req.body;
    const campaignId = generateCampaignId();
    
    if (!name || !message) {
      return res.status(400).json({
        error: 'Nome da campanha e mensagem são obrigatórios'
      });
    }

    let contacts = [];

    // Se arquivo CSV foi enviado
    if (req.file) {
      contacts = await parseCSVFile(req.file.path);
      
      // Limpar arquivo temporário
      fs.unlinkSync(req.file.path);
    } 
    // Se contatos foram enviados via JSON
    else if (req.body.contacts) {
      contacts = JSON.parse(req.body.contacts);
    } 
    else {
      return res.status(400).json({
        error: 'Contatos são obrigatórios (CSV ou JSON)'
      });
    }

    // Validar contatos
    const validContacts = contacts.filter(contact => 
      contact.phone && contact.phone.trim()
    );

    if (validContacts.length === 0) {
      return res.status(400).json({
        error: 'Nenhum contato válido encontrado'
      });
    }

    // Salvar campanha
    const campaign = {
      id: campaignId,
      name,
      message,
      totalContacts: validContacts.length,
      status: scheduleDate ? 'scheduled' : 'pending',
      createdAt: new Date().toISOString(),
      scheduleDate
    };

    await saveCampaign(campaign);

    // Se não tem agendamento, processa imediatamente
    if (!scheduleDate) {
      await campaignQueue.processCampaign(campaignId, validContacts, message);
      
      campaign.status = 'processing';
      await saveCampaign(campaign);
    }

    res.json({
      success: true,
      campaign,
      validContacts: validContacts.length,
      invalidContacts: contacts.length - validContacts.length
    });

  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar campanhas
router.get('/', async (req, res) => {
  try {
    const campaigns = await getAllCampaigns();
    res.json({ campaigns });
  } catch (error) {
    console.error('Erro ao listar campanhas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter detalhes de uma campanha
router.get('/:id', async (req, res) => {
  try {
    const campaign = await getCampaign(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const messages = await getCampaignMessages(req.params.id);
    
    res.json({
      campaign,
      messages,
      stats: calculateStats(messages)
    });

  } catch (error) {
    console.error('Erro ao obter campanha:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pausar/Retomar campanha
router.put('/:id/toggle', async (req, res) => {
  try {
    const campaign = await getCampaign(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const newStatus = campaign.status === 'paused' ? 'processing' : 'paused';
    
    campaign.status = newStatus;
    await saveCampaign(campaign);

    // TODO: Implementar pausa/retomada da fila

    res.json({ 
      success: true, 
      status: newStatus,
      message: `Campanha ${newStatus === 'paused' ? 'pausada' : 'retomada'} com sucesso`
    });

  } catch (error) {
    console.error('Erro ao pausar/retomar campanha:', error);
    res.status(500).json({ error: error.message });
  }
});

// Funções auxiliares

function generateCampaignId() {
  return 'camp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const contacts = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Mapear colunas comuns
        const contact = {
          name: row.nome || row.name || row.Name || '',
          phone: row.telefone || row.phone || row.Phone || row.whatsapp || '',
          email: row.email || row.Email || ''
        };
        
        if (contact.phone) {
          contacts.push(contact);
        }
      })
      .on('end', () => resolve(contacts))
      .on('error', reject);
  });
}

async function saveCampaign(campaign) {
  const client = redis.createClient();
  await client.connect();
  
  await client.hSet('campaigns', campaign.id, JSON.stringify(campaign));
  await client.disconnect();
}

async function getCampaign(campaignId) {
  const client = redis.createClient();
  await client.connect();
  
  const data = await client.hGet('campaigns', campaignId);
  await client.disconnect();
  
  return data ? JSON.parse(data) : null;
}

async function getAllCampaigns() {
  const client = redis.createClient();
  await client.connect();
  
  const campaignData = await client.hGetAll('campaigns');
  await client.disconnect();
  
  return Object.values(campaignData).map(data => JSON.parse(data));
}

async function getCampaignMessages(campaignId) {
  const client = redis.createClient();
  await client.connect();
  
  const messages = await client.hGetAll(`campaign:${campaignId}:messages`);
  await client.disconnect();
  
  return Object.values(messages).map(data => JSON.parse(data));
}

function calculateStats(messages) {
  const total = messages.length;
  const sent = messages.filter(m => m.status === 'sent').length;
  const failed = messages.filter(m => m.status === 'failed').length;
  const pending = total - sent - failed;
  
  return {
    total,
    sent,
    failed,
    pending,
    successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : 0
  };
}

module.exports = router;