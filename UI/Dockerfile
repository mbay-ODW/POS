# Stage 1: Build — läuft immer auf amd64 (npm output ist plattform-unabhängig)
FROM --platform=linux/amd64 node:20-alpine AS build-step

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime — native für Zielplattform (arm64, arm/v7, amd64)
FROM nginx:1.25.1-alpine AS runtime-image

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-step /app/dist/ui /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
