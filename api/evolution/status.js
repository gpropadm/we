// Vercel Serverless Function - Evolution Status
module.exports = async (req, res) => {
  try {
    const status = {
      provider: "evolution",
      evolutionEnabled: true,
      timestamp: new Date().toISOString(),
      evolution: {
        available: true,
        instance: "connected",
        demo: true,
        message: "Rodando em modo demonstração na Vercel"
      },
      business: {
        configured: false,
        available: false
      },
      vercel: {
        deployment: true,
        serverless: true,
        region: process.env.VERCEL_REGION || "unknown"
      }
    };

    res.json({
      success: true,
      status
    });
    
  } catch (error) {
    console.error('Erro evolution status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};