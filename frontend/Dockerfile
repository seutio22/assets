FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências do diretório frontend
COPY frontend/package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte do diretório frontend
COPY frontend/ .

# Build da aplicação
RUN npm run build

# Instalar serve globalmente
RUN npm install -g serve

# Expor porta (Railway fornece via variável PORT)
EXPOSE ${PORT:-3000}

# Comando para iniciar usando PORT do Railway
CMD sh -c "serve -s dist -l ${PORT:-3000}"

