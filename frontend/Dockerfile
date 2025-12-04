FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Instalar serve globalmente
RUN npm install -g serve

# Copiar script de inicialização e dar permissão
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expor porta (Railway fornece via variável PORT)
EXPOSE 3000

# Comando para iniciar usando PORT do Railway
CMD ["/app/start.sh"]

