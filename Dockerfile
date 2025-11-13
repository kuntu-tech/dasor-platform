# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including devDeps for build)
RUN npm ci --no-audit --no-fund || npm install --legacy-peer-deps --no-audit --no-fund

# Copy source code
COPY . .

# Build application
RUN npm run build

# Remove dev dependencies to shrink image
RUN npm prune --omit=dev --legacy-peer-deps --no-audit --no-fund || true

# Expose port (Render sets PORT env automatically)
EXPOSE 4001

# Launch application
CMD ["npm", "start"]
