set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "QuickPrint Installation"
echo "======================="

echo -e "${YELLOW}[1/8] Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js 18+ required${NC}"
    exit 1
fi
echo -e "${GREEN}Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}npm $(npm -v)${NC}"

echo -e "${YELLOW}[2/8] Installing root dependencies...${NC}"
npm install

echo -e "${YELLOW}[3/8] Installing backend dependencies...${NC}"
cd backend && npm install && cd ..

echo -e "${YELLOW}[4/8] Installing frontend dependencies...${NC}"
cd frontend && npm install && cd ..

echo -e "${YELLOW}[5/8] Installing async-worker dependencies...${NC}"
cd async-worker && npm install && cd ..

echo -e "${YELLOW}[6/8] Setting up environment files...${NC}"

if [ ! -f .env ]; then
cat > .env << 'EOF'
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=quickprint
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin
JWT_SECRET=generate_with_openssl_rand_hex_32
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+91your_phone
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_email@domain.com
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET=your-bucket-name
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
EOF
echo -e "${GREEN}Created .env${NC}"
fi

if [ ! -f backend/.env ]; then
cat > backend/.env << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/quickprint
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://admin:admin@localhost:5672
JWT_SECRET=generate_with_openssl_rand_hex_32
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+91your_phone
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_email@domain.com
USE_MOCK_OTP=true
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET=your-bucket-name
EOF
echo -e "${GREEN}Created backend/.env${NC}"
fi

if [ ! -f frontend/.env ]; then
cat > frontend/.env << 'EOF'
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_ENV=development
VITE_DEBUG=true
VITE_USE_MOCK=false
VITE_ENABLE_UPI_PAYMENTS=true
VITE_ENABLE_COD_PAYMENTS=true
VITE_ENABLE_GOOGLE_AUTH=true
VITE_ENABLE_PHONE_AUTH=true
VITE_DEFAULT_MAP_CENTER_LAT=17.4401
VITE_DEFAULT_MAP_CENTER_LNG=78.3489
VITE_DEFAULT_SEARCH_RADIUS=5000
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_MAPS_API_KEY=
VITE_RAZORPAY_KEY_ID=
EOF
echo -e "${GREEN}Created frontend/.env${NC}"
fi

if [ ! -f async-worker/.env ]; then
cat > async-worker/.env << 'EOF'
NODE_ENV=development
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/quickprint
RABBITMQ_URL=amqp://admin:admin@localhost:5672
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+91your_phone
USE_MOCK_SMS=true
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_email@domain.com
USE_MOCK_EMAIL=true
EOF
echo -e "${GREEN}Created async-worker/.env${NC}"
fi

echo -e "${YELLOW}[7/8] Setting up database...${NC}"
cd backend
npx prisma generate
npx prisma migrate deploy 2>/dev/null || echo -e "${YELLOW}Migrations skipped (start PostgreSQL first)${NC}"
cd ..

echo -e "${YELLOW}[8/8] Building TypeScript...${NC}"
cd backend && npm run build 2>/dev/null || true && cd ..
cd async-worker && npm run build 2>/dev/null || true && cd ..

echo ""
echo -e "${GREEN}Installation Complete${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env files with your credentials"
echo "2. Start infrastructure: docker-compose up -d postgres redis rabbitmq"
echo "3. Run migrations: cd backend && npx prisma migrate deploy"
echo "4. Start servers:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: cd frontend && npm run dev"
echo "   - Worker: cd async-worker && npm run dev"
