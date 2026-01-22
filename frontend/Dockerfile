# =====================================
# QuickPrint Frontend - Dockerfile
# =====================================
# Multi-stage build for optimized production image

# ----- Stage 1: Builder -----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_APP_ENV=production
ARG VITE_USE_MOCK=false
ARG VITE_ENABLE_UPI_PAYMENTS=true
ARG VITE_ENABLE_COD_PAYMENTS=true
ARG VITE_ENABLE_GOOGLE_AUTH=true
ARG VITE_ENABLE_PHONE_AUTH=true
ARG VITE_RAZORPAY_KEY_ID

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_USE_MOCK=$VITE_USE_MOCK
ENV VITE_ENABLE_UPI_PAYMENTS=$VITE_ENABLE_UPI_PAYMENTS
ENV VITE_ENABLE_COD_PAYMENTS=$VITE_ENABLE_COD_PAYMENTS
ENV VITE_ENABLE_GOOGLE_AUTH=$VITE_ENABLE_GOOGLE_AUTH
ENV VITE_ENABLE_PHONE_AUTH=$VITE_ENABLE_PHONE_AUTH
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

# Build the application
RUN npm run build

# ----- Stage 2: Production (Nginx) -----
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
