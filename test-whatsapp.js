#!/usr/bin/env node

/**
 * Script de teste para validar WhatsApp Business API
 * Execute: node test-whatsapp.js
 */

require('dotenv').config();
const whatsappService = require('./services/whatsapp');

async function testWhatsAppAPI() {
  console.log('🧪 TESTE DO WHATSAPP BUSINESS API');
  console.log('================================');
  console.log('');

  // Verificar se as credenciais estão configuradas
  const hasCredentials = 
    process.env.WHATSAPP_ACCESS_TOKEN && 
    process.env.WHATSAPP_ACCESS_TOKEN !== 'seu_access_token_aqui' &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_PHONE_NUMBER_ID !== 'seu_phone_number_id_aqui';

  if (!hasCredentials) {
    console.log('⚠️  MODO DEMONSTRAÇÃO');
    console.log('   Configure as credenciais no .env para teste real');
    console.log('');
    
    // Teste simulado
    console.log('📱 Testando envio simulado...');
    try {
      const result = await whatsappService.sendMessage('11999999999', 'Mensagem de teste');
      console.log('✅ Sucesso:', result);
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
    return;
  }

  console.log('🔑 CREDENCIAIS ENCONTRADAS');
  console.log('   Access Token: ' + process.env.WHATSAPP_ACCESS_TOKEN.substring(0, 20) + '...');
  console.log('   Phone ID: ' + process.env.WHATSAPP_PHONE_NUMBER_ID);
  console.log('');

  // TESTE 1: Validação de número
  console.log('🧪 TESTE 1: Validação de números');
  const testNumbers = ['11999999999', '21888888888', '11abc123456'];
  
  testNumbers.forEach(number => {
    const isValid = whatsappService.isValidPhoneNumber(number);
    const clean = whatsappService.cleanPhoneNumber(number);
    console.log(`   ${number} → ${isValid ? '✅' : '❌'} → ${clean}`);
  });
  console.log('');

  // TESTE 2: Envio real (descomente se quiser testar)
  /*
  console.log('📱 TESTE 2: Envio real (CUIDADO: Vai enviar WhatsApp real!)');
  const testPhone = '11999999999'; // COLOQUE SEU NÚMERO AQUI
  
  try {
    const result = await whatsappService.sendMessage(testPhone, 'Teste do sistema WhatsApp Bulk');
    console.log('✅ Mensagem enviada com sucesso!');
    console.log('   ID da mensagem:', result.messageId);
    console.log('   Número limpo:', result.phone);
  } catch (error) {
    console.log('❌ Erro no envio:', error.message);
    
    if (error.message.includes('403')) {
      console.log('💡 Dica: Verifique se o token tem permissões');
    }
    if (error.message.includes('400')) {
      console.log('💡 Dica: Verifique se o número está no formato correto');
    }
  }
  */
}

// TESTE 3: Teste de carga (simulado)
async function testLoad() {
  console.log('');
  console.log('🚀 TESTE 3: Simulação de carga');
  const start = Date.now();
  const promises = [];
  
  // Simular 100 envios
  for (let i = 0; i < 100; i++) {
    promises.push(
      whatsappService.sendMessage(`1199999${String(i).padStart(4, '0')}`, `Teste ${i + 1}`)
        .catch(() => null) // Ignorar erros na simulação
    );
  }
  
  const results = await Promise.all(promises);
  const successful = results.filter(r => r !== null).length;
  const elapsed = Date.now() - start;
  const rate = (successful / elapsed * 1000).toFixed(2);
  
  console.log(`   📊 Resultados:`);
  console.log(`   - Total: 100 mensagens`);
  console.log(`   - Sucesso: ${successful}`);
  console.log(`   - Tempo: ${elapsed}ms`);
  console.log(`   - Taxa: ${rate} msg/s`);
}

// TESTE 4: Teste de integração
async function testIntegration() {
  console.log('');
  console.log('🔗 TESTE 4: Integração completa');
  
  try {
    // Testar API de stats
    const statsResponse = await fetch('http://localhost:3000/api/dashboard/stats');
    const stats = await statsResponse.json();
    console.log('✅ API Stats funcionando');
    console.log(`   - Mensagens na fila: ${stats.queue.waiting}`);
    console.log(`   - Mensagens completadas: ${stats.queue.completed}`);
    
    // Testar API de campanhas
    const campaignsResponse = await fetch('http://localhost:3000/api/campaigns');
    const campaigns = await campaignsResponse.json();
    console.log('✅ API Campanhas funcionando');
    console.log(`   - Total de campanhas: ${campaigns.campaigns.length}`);
    
  } catch (error) {
    console.log('❌ Erro na integração:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando (npm start)');
  }
}

// Executar todos os testes
async function runAllTests() {
  try {
    await testWhatsAppAPI();
    await testLoad();
    await testIntegration();
    
    console.log('');
    console.log('🎉 TESTES CONCLUÍDOS!');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Configure credenciais reais no .env');
    console.log('2. Descomente o teste de envio real');
    console.log('3. Teste com seu próprio número primeiro');
    console.log('4. Aumente gradualmente o volume');
    
  } catch (error) {
    console.error('💥 Erro nos testes:', error);
  }
}

runAllTests();