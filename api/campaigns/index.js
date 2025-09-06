// Vercel Serverless Function - Campaigns
module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      // Listar campanhas (mock)
      const campaigns = [
        {
          id: "camp_demo_001",
          name: "Campanha Demo Vercel",
          message: "Olá {nome}! Sistema funcionando na Vercel!",
          totalContacts: 1000,
          status: "completed",
          createdAt: new Date().toISOString()
        },
        {
          id: "camp_demo_002", 
          name: "Teste Evolution API",
          message: "Mensagem via Evolution API para {telefone}",
          totalContacts: 500,
          status: "processing",
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json({ campaigns });
      
    } else if (req.method === 'POST') {
      // Criar campanha (mock)
      const campaignId = 'camp_vercel_' + Date.now();
      
      const campaign = {
        id: campaignId,
        name: "Nova Campanha Vercel",
        message: "Mensagem de teste na Vercel",
        totalContacts: 100,
        status: "processing",
        createdAt: new Date().toISOString()
      };
      
      // Simular processamento
      console.log(`🎯 [VERCEL DEMO] Processando campanha ${campaignId}`);
      
      res.json({
        success: true,
        campaign,
        validContacts: 100,
        invalidContacts: 0
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Erro campaigns:', error);
    res.status(500).json({ error: error.message });
  }
};