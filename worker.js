#!/usr/bin/env node

/**
 * Worker Process para processamento das filas
 * Execute este arquivo separadamente: node worker.js
 */

require('dotenv').config();
const { messageQueue, campaignQueue } = require('./services/queue');

console.log('🔧 Iniciando worker de processamento de filas...');

// Configurações do worker
const CONCURRENCY = 10; // Processos simultâneos
const WORKER_NAME = `worker-${process.pid}`;

// Log das configurações
console.log(`📊 Configurações:`);
console.log(`   - Concorrência: ${CONCURRENCY}`);
console.log(`   - Rate Limit: ${process.env.MESSAGES_PER_SECOND || 200} msg/s`);
console.log(`   - Worker ID: ${WORKER_NAME}`);
console.log('');

// Event listeners para monitoramento
messageQueue.on('ready', () => {
  console.log('✅ Fila de mensagens conectada');
});

messageQueue.on('error', (error) => {
  console.error('❌ Erro na fila de mensagens:', error);
});

messageQueue.on('waiting', (jobId) => {
  console.log(`⏳ Job ${jobId} adicionado na fila`);
});

messageQueue.on('active', (job) => {
  console.log(`🚀 Processando mensagem para: ${job.data.phoneNumber}`);
});

messageQueue.on('completed', (job, result) => {
  console.log(`✅ Mensagem enviada: ${job.data.phoneNumber} (ID: ${result.messageId})`);
});

messageQueue.on('failed', (job, err) => {
  console.error(`❌ Falha no envio: ${job.data.phoneNumber} - ${err.message}`);
});

messageQueue.on('stalled', (job) => {
  console.log(`⚠️  Job travado: ${job.id}`);
});

// Event listeners para campanha
campaignQueue.on('ready', () => {
  console.log('✅ Fila de campanhas conectada');
});

campaignQueue.on('active', (job) => {
  console.log(`🎯 Processando campanha: ${job.data.campaignId}`);
});

campaignQueue.on('completed', (job) => {
  console.log(`✅ Campanha processada: ${job.data.campaignId}`);
});

campaignQueue.on('failed', (job, err) => {
  console.error(`❌ Falha na campanha: ${job.data.campaignId} - ${err.message}`);
});

// Estatísticas periódicas
setInterval(async () => {
  try {
    const messageStats = await getQueueStats(messageQueue);
    const campaignStats = await getQueueStats(campaignQueue);
    
    console.log('');
    console.log('📊 ESTATÍSTICAS DO WORKER');
    console.log('────────────────────────────');
    console.log(`Mensagens - Aguardando: ${messageStats.waiting} | Ativo: ${messageStats.active} | Concluído: ${messageStats.completed} | Falhou: ${messageStats.failed}`);
    console.log(`Campanhas - Aguardando: ${campaignStats.waiting} | Ativo: ${campaignStats.active} | Concluído: ${campaignStats.completed} | Falhou: ${campaignStats.failed}`);
    console.log(`Uptime: ${formatUptime(process.uptime())}`);
    console.log(`Memória: ${formatMemory(process.memoryUsage().rss)}`);
    console.log('');
    
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
  }
}, 30000); // A cada 30 segundos

// Função para obter estatísticas da fila
async function getQueueStats(queue) {
  const waiting = await queue.getWaiting();
  const active = await queue.getActive();
  const completed = await queue.getCompleted();
  const failed = await queue.getFailed();
  
  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length
  };
}

// Formatar uptime
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours}h ${minutes}m ${secs}s`;
}

// Formatar memória
function formatMemory(bytes) {
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, encerrando worker...');
  
  await messageQueue.close();
  await campaignQueue.close();
  
  console.log('✅ Worker encerrado com sucesso');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, encerrando worker...');
  
  await messageQueue.close();
  await campaignQueue.close();
  
  console.log('✅ Worker encerrado com sucesso');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rejeitada não tratada:', reason);
  process.exit(1);
});

console.log('🚀 Worker iniciado com sucesso!');
console.log('💡 Use Ctrl+C para parar o worker');
console.log('');

// Monitoramento de saúde
setInterval(() => {
  // Health check simples
  if (process.memoryUsage().rss > 500 * 1024 * 1024) { // 500MB
    console.warn('⚠️  Alto uso de memória detectado');
  }
}, 60000); // A cada minuto