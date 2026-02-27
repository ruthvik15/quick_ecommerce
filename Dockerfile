# Stage 1: Build React frontend
FROM node:18 AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Build backend dependencies
FROM node:18 AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 3: Final image
FROM node:18
WORKDIR /app

# Copy node_modules
COPY --from=backend-builder /app/node_modules ./node_modules

# Copy backend files
COPY . .

# Copy built client to serve as static files
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3000
CMD ["node", "app.js"]
