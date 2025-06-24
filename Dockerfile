# Stage 1: Build dependencies
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Final image
FROM node:18
WORKDIR /app

# Copy node_modules and all app files
COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["node", "app.js"]
