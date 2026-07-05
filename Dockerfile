# Build Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Setup Backend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy built frontend static files to backend public directory
# (We need to configure Express to serve these static files)
COPY --from=build-frontend /app/frontend/dist ./public

ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
