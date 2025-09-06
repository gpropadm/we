# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO

## 📋 **PRÉ-REQUISITOS**

### **1. Servidor (VPS/Cloud)**
- Ubuntu 20.04+ / CentOS 7+
- 2GB RAM mínimo (4GB recomendado)
- 20GB disco
- Docker instalado

### **2. Domínio**
- Domínio próprio (ex: whatsapp-bulk.seucliente.com)
- SSL/HTTPS configurado

---

## 🐳 **OPÇÃO 1: DOCKER COMPLETO (RECOMENDADO)**

### **Passo 1: Preparar servidor**
```bash
# Conectar via SSH
ssh root@seu-servidor-ip

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### **Passo 2: Fazer upload do projeto**
```bash
# No seu computador
scp -r /home/alex/whatsapp-bulk root@seu-servidor:/var/www/
```

### **Passo 3: Docker Compose Produção**
Criar arquivo `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # Evolution API
  evolution-api:
    image: atendai/evolution-api:latest
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_API_KEY=chave-super-segura-aqui
      - DATABASE_CONNECTION_URI=mongodb://mongo:27017/evolution
    volumes:
      - evolution_data:/evolution/instances
      - evolution_store:/evolution/store
    depends_on:
      - mongo
    restart: unless-stopped

  # MongoDB para Evolution
  mongo:
    image: mongo:5
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

  # Nossa aplicação
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - EVOLUTION_API_URL=http://evolution-api:8080
      - EVOLUTION_API_KEY=chave-super-segura-aqui
      - EVOLUTION_INSTANCE=bulk_sender_prod
      - WHATSAPP_PROVIDER=evolution
      - EVOLUTION_ENABLED=true
    depends_on:
      - redis
      - evolution-api
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped

  # Worker
  worker:
    build: .
    command: npm run worker
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - app
    restart: unless-stopped
    deploy:
      replicas: 2

  # Nginx (proxy reverso)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis_data:
  mongo_data:
  evolution_data:
  evolution_store:
```

### **Passo 4: Configurar SSL e Nginx**
```nginx
# nginx.conf
server {
    listen 80;
    server_name whatsapp-bulk.seucliente.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name whatsapp-bulk.seucliente.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /evolution {
        proxy_pass http://evolution-api:8080;
        proxy_set_header Host $host;
    }
}
```

### **Passo 5: Deploy**
```bash
# No servidor
cd /var/www/whatsapp-bulk

# Subir tudo
docker-compose -f docker-compose.prod.yml up -d

# Verificar logs
docker-compose logs -f
```

---

## 🔧 **OPÇÃO 2: INSTALAÇÃO MANUAL**

### **Passo 1: Evolution API**
```bash
# Instalar Evolution API
docker run -d \
    --name evolution_api \
    -p 8080:8080 \
    -e AUTHENTICATION_API_KEY=chave-segura \
    atendai/evolution-api:latest
```

### **Passo 2: Redis**
```bash
apt install redis-server
systemctl enable redis
systemctl start redis
```

### **Passo 3: Node.js**
```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar dependências
cd /var/www/whatsapp-bulk
npm install --production
```

### **Passo 4: PM2 (Process Manager)**
```bash
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

---

## ⚙️ **CONFIGURAÇÃO PRODUÇÃO**

### **Variáveis de ambiente (.env.production)**
```env
# Evolution API
WHATSAPP_PROVIDER=evolution
EVOLUTION_ENABLED=true
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=chave-super-segura-aqui
EVOLUTION_INSTANCE=bulk_sender_prod

# Segurança
NODE_ENV=production
SESSION_SECRET=chave-sessao-super-segura

# Performance
MESSAGES_PER_SECOND=150
MAX_RETRIES=5
REDIS_URL=redis://localhost:6379

# Logs
LOG_LEVEL=info
LOG_FILE=/var/log/whatsapp-bulk/app.log
```

---

## 📱 **CONFIGURAR WHATSAPP**

### **Passo 1: Acessar Evolution API**
```
https://whatsapp-bulk.seucliente.com/evolution/
```

### **Passo 2: Gerar QR Code**
```bash
curl -X POST https://whatsapp-bulk.seucliente.com/api/evolution/setup
```

### **Passo 3: Escanear com WhatsApp**
- Abrir WhatsApp no celular
- Menu > Dispositivos Conectados
- Escanear QR Code

---

## 🔒 **SEGURANÇA**

### **1. Firewall**
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### **2. SSL Certificate (Let's Encrypt)**
```bash
apt install certbot
certbot --nginx -d whatsapp-bulk.seucliente.com
```

### **3. Backup Automático**
```bash
# Criar script de backup
crontab -e
# Adicionar: 0 2 * * * /path/to/backup-script.sh
```

---

## 📊 **MONITORAMENTO**

### **1. Logs**
```bash
# Ver logs em tempo real
docker-compose logs -f app
tail -f /var/log/whatsapp-bulk/app.log
```

### **2. Status dos serviços**
```bash
curl https://whatsapp-bulk.seucliente.com/api/evolution/status
```

### **3. Métricas**
- CPU/RAM usage
- Mensagens por segundo
- Taxa de sucesso

---

## 🚀 **RESULTADO FINAL**

### **URLs em produção:**
- **Dashboard**: https://whatsapp-bulk.seucliente.com
- **API**: https://whatsapp-bulk.seucliente.com/api/
- **Evolution**: https://whatsapp-bulk.seucliente.com/evolution/

### **Capacidade:**
- ✅ 100k mensagens: ~10 minutos
- ✅ 1 milhão: ~1h 40min
- ✅ Multiple instâncias WhatsApp
- ✅ Fallback automático
- ✅ Monitoramento completo

---

## 💰 **CUSTOS MENSAIS**

**Servidor VPS (DigitalOcean/AWS):**
- 2GB RAM: ~$20/mês
- 4GB RAM: ~$40/mês (recomendado)

**Domínio + SSL:**
- ~$15/ano

**Total: ~$40-60/mês para sistema completo**

---

## 📞 **SUPORTE**

Para deploy em produção:
1. Configure servidor conforme guia
2. Teste tudo em staging primeiro
3. Monitor logs nas primeiras horas
4. Configure backups automáticos