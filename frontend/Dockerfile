# Este Dockerfile força o Railway a usar Nixpacks
# O Railway detectará o nixpacks.toml e usará Nixpacks automaticamente
FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código
COPY . .

# Build
RUN npm run build

# Instalar serve
RUN npm install -g serve

# Expor porta
EXPOSE 3000

# Iniciar
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]

