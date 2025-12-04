FROM node:20-alpine

WORKDIR /app

# Se o Root Directory for 'frontend', o contexto já é frontend/
# Copiar arquivos do contexto atual
COPY package*.json ./
COPY . .

# Instalar dependências
RUN npm install

# Build da aplicação
RUN npm run build

# Instalar serve globalmente
RUN npm install -g serve

# Criar script de inicialização inline
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'PORT=${PORT:-3000}' >> /app/start.sh && \
    echo 'exec serve -s dist -l $PORT' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expor porta
EXPOSE 3000

# Comando para iniciar usando PORT do Railway
CMD ["/app/start.sh"]

