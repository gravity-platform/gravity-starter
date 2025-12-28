FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat git
WORKDIR /app
RUN npm install -g turbo@^2

# Prune stage - create minimal monorepo
FROM base AS pruner
COPY . .
RUN turbo prune @gravity-platform/gravity-sab --docker

# Build stage
FROM base AS builder
ARG VITE_API_URL
ARG VITE_WEBSOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL
COPY --from=pruner /app/out/json/ .
RUN npm install --ignore-scripts
COPY --from=pruner /app/out/full/ .
COPY tsconfig.base.json ./
RUN npm run build -w @gravity-platform/gravity-client || true
RUN npm run build -w @gravity-platform/gravity-sab

# Production stage
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/GravitySAB/dist /usr/share/nginx/html
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
