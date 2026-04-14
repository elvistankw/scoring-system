# Backend Dockerfile for Railway
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port (Railway will override this)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
