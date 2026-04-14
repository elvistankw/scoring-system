# Backend Dockerfile - Express API Server
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Change ownership
RUN chown -R expressjs:nodejs /app

# Switch to non-root user
USER expressjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "index.js"]
