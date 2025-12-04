FROM node:20-alpine

WORKDIR /app

# Copiar package.json primeiro (para cache de dependências)
COPY package.json package-lock.json* ./

# Debug: verificar se package.json foi copiado
RUN ls -la package.json || (echo "ERRO: package.json não encontrado!" && ls -la && exit 1)

# Instalar dependências
RUN npm install

# Copiar resto dos arquivos
COPY . .

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

