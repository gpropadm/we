FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p uploads logs

# Exposer porta
EXPOSE 3000

# Comando padrão
CMD ["npm", "start"]