FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte (inclui start.sh)
COPY . .

# Build da aplicação
RUN npm run build

# Dar permissão de execução ao script (depois do build para não invalidar cache)
RUN chmod +x /app/start.sh

# Instalar serve globalmente
RUN npm install -g serve

# Expor porta (Railway fornece via variável PORT)
EXPOSE 3000

# Comando para iniciar usando PORT do Railway
CMD ["/app/start.sh"]

