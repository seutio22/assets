FROM node:20-alpine

WORKDIR /app

# Copiar package.json do frontend
COPY frontend/package*.json ./

# Instalar dependências
RUN npm install

# Copiar código do frontend
COPY frontend/ ./

# Build
RUN npm run build

# Instalar serve
RUN npm install -g serve

# Expor porta
EXPOSE 3000

# Iniciar
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]

