# WhatsApp Bulk Sender

Sistema profissional para envio em massa de mensagens WhatsApp usando a API oficial do WhatsApp Business.

## ✨ Características

- 📱 **API Oficial**: Usa WhatsApp Business API
- 🚀 **Alta Performance**: Até 200 mensagens/segundo
- 📊 **Dashboard Web**: Interface completa para gerenciamento
- 🔄 **Sistema de Filas**: Rate limiting automático com Redis
- 📈 **Monitoramento**: Relatórios em tempo real
- 📋 **Upload CSV**: Importação fácil de contatos
- 🎯 **Personalização**: Mensagens personalizadas com variáveis
- 🔧 **Escalável**: Arquitetura preparada para milhões de mensagens

## 🚀 Como Usar

### 1. Pré-requisitos

- Node.js 16+
- Redis
- Conta WhatsApp Business aprovada

### 2. Instalação

```bash
# Clonar o projeto
git clone <seu-repositorio>
cd whatsapp-bulk

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

### 3. Configuração WhatsApp Business API

No arquivo `.env`, configure:

```env
WHATSAPP_BUSINESS_ACCOUNT_ID=seu_business_account_id
WHATSAPP_ACCESS_TOKEN=seu_access_token
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu_webhook_token
```

### 4. Executar

```bash
# Iniciar Redis (se não estiver rodando)
redis-server

# Terminal 1: Servidor web
npm start

# Terminal 2: Worker de processamento
npm run worker
```

### 5. Acessar Dashboard

Abra: `http://localhost:3000`

## 📋 Formato CSV

O arquivo CSV deve conter as colunas:

```csv
nome,telefone,email
João Silva,11999999999,joao@email.com
Maria Santos,21888888888,maria@email.com
```

## 🔧 Configurações Avançadas

### Rate Limiting

```env
MESSAGES_PER_SECOND=200  # Máximo recomendado pela API
MAX_RETRIES=3           # Tentativas em caso de falha
```

### Personalização de Mensagens

Use variáveis nas mensagens:

```
Olá {nome}! Esta é uma mensagem personalizada.
Seu telefone é {telefone}.
```

## 📊 Monitoramento

O sistema oferece:

- **Dashboard em tempo real**
- **Estatísticas de envio**
- **Logs detalhados**
- **Status das campanhas**
- **Taxa de sucesso**

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Dashboard     │    │    Server    │    │     Worker      │
│   (Frontend)    │───▶│   Express    │───▶│   Bull Queue    │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │                      │
                              ▼                      ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │    Redis     │    │  WhatsApp API   │
                       │   (Cache)    │    │   (Official)    │
                       └──────────────┘    └─────────────────┘
```

## 🚦 Limites da API

- **Rate Limit**: 250 mensagens/segundo (recomendamos 200)
- **Mensagens/dia**: Varia conforme aprovação do Facebook
- **Templates**: Necessário aprovação prévia para alguns tipos

## 💡 Dicas de Uso

### Para 100k Mensagens:
- **Tempo estimado**: ~8 minutos (200 msg/s)
- **Segmentação**: Divida em campanhas menores
- **Horário**: Evite picos de tráfego

### Boas Práticas:
- ✅ Use templates aprovados
- ✅ Mantenha lista de opt-out
- ✅ Monitore taxa de bloqueios
- ✅ Teste com números pequenos primeiro

## 🔒 Conformidade

Este sistema está em conformidade com:
- Termos de Serviço WhatsApp Business
- LGPD (Lei Geral de Proteção de Dados)
- Políticas de Anti-Spam

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
npm start      # Servidor de produção
npm run dev    # Servidor de desenvolvimento
npm run worker # Worker de processamento
```

### API Endpoints

- `POST /api/campaigns/create` - Criar campanha
- `GET /api/campaigns` - Listar campanhas
- `GET /api/dashboard/stats` - Estatísticas
- `POST /api/contacts/validate` - Validar telefone

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do worker
2. Confirme as credenciais da API
3. Teste com um número pequeno primeiro

## 📄 Licença

Este projeto é proprietário. Desenvolvido para uso comercial.

---

**⚠️ IMPORTANTE**: Este sistema deve ser usado apenas com consentimento dos destinatários e em conformidade com as leis locais de proteção de dados e anti-spam.