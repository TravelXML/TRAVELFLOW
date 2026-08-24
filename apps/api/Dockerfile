FROM node:20-slim AS base
RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation libnss3 libatk-bridge2.0-0 libx11-xcb1 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm install --workspace apps/api
RUN npm run --workspace apps/api prisma:generate
RUN npm run --workspace apps/api build

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]
