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
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_RECAPTCHA_SITE_KEY

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_USE_MOCK=$VITE_USE_MOCK
ENV VITE_ENABLE_UPI_PAYMENTS=$VITE_ENABLE_UPI_PAYMENTS
ENV VITE_ENABLE_COD_PAYMENTS=$VITE_ENABLE_COD_PAYMENTS
ENV VITE_ENABLE_GOOGLE_AUTH=$VITE_ENABLE_GOOGLE_AUTH
ENV VITE_ENABLE_PHONE_AUTH=$VITE_ENABLE_PHONE_AUTH
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY

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

# Health check (use 127.0.0.1 to force IPv4)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
