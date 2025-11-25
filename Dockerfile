# ==========================
# STAGE 1 — Build
# ==========================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copiamos configuración de dependencias
COPY package*.json ./
RUN npm install

# Copiamos el código fuente
COPY . .

# Compilamos Typescript → Javascript
RUN npm run build

# ==========================
# STAGE 2 — Runtime
# ==========================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Copiamos solo deps de producción
COPY package*.json ./
RUN npm install --only=production

# Copiamos lo compilado desde el builder
COPY --from=builder /usr/src/app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]
