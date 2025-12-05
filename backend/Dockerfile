FROM node:20-alpine

# Instalar OpenSSL necessário para Prisma no Alpine
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Copiar arquivos de dependências do backend
COPY package*.json ./

# Copiar prisma schema ANTES de instalar (para o postinstall funcionar)
COPY prisma ./prisma

# Instalar dependências (postinstall vai executar prisma generate)
RUN npm install

# Copiar código fonte do backend
COPY src ./src
COPY tsconfig.json ./

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]

