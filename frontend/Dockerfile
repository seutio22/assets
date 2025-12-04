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

# Expor porta
EXPOSE 3000

# Comando para iniciar
CMD ["serve", "-s", "dist", "-l", "3000"]

