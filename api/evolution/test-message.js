// Vercel Serverless Function - Test Message
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
    }

    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Telefone e mensagem são obrigatórios'
      });
    }

    // Simular envio na Vercel
    console.log(`📱 [VERCEL DEMO] Enviando para ${phone}: ${message}`);
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = {
      success: true,
      messageId: 'vercel_demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      phone: phone,
      status: 'sent',
      timestamp: new Date().toISOString(),
      provider: 'evolution-demo'
    };
    
    res.json({
      success: true,
      message: 'Mensagem enviada via Evolution API (Demo Vercel)',
      result
    });
    
  } catch (error) {
    console.error('Erro teste Evolution:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};