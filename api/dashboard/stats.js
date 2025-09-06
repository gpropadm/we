// Vercel Serverless Function
module.exports = async (req, res) => {
  try {
    // Mock stats para demonstração na Vercel
    const stats = {
      queue: {
        waiting: 0,
        active: 0,
        completed: Math.floor(Math.random() * 1000),
        failed: Math.floor(Math.random() * 10),
        total: Math.floor(Math.random() * 1000)
      },
      campaigns: {
        total: Math.floor(Math.random() * 50),
        active: Math.floor(Math.random() * 5),
        completed: Math.floor(Math.random() * 40),
        scheduled: Math.floor(Math.random() * 3),
        paused: 0
      },
      messages: {
        total: Math.floor(Math.random() * 10000),
        sent: Math.floor(Math.random() * 9500),
        failed: Math.floor(Math.random() * 50),
        pending: Math.floor(Math.random() * 450),
        successRate: (95 + Math.random() * 4).toFixed(2)
      },
      system: {
        messagesPerSecond: "200",
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro stats:', error);
    res.status(500).json({ error: error.message });
  }
};