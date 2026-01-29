#!/bin/bash
set -e

echo "QuickPrint EC2 Deployment"
echo "========================="

echo "[1/6] Installing Docker..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker

echo "[2/6] Cloning repository..."
cd ~
rm -rf quickprint
git clone https://github.com/SA-Ash/quickprint.git
cd quickprint

echo "[3/6] Creating .env file..."
cat > .env << 'EOF'
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=quickprint
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=CHANGE_ME
JWT_SECRET=CHANGE_ME_GENERATE_WITH_OPENSSL_RAND_HEX_32
TWILIO_SID=CHANGE_ME
TWILIO_AUTH_TOKEN=CHANGE_ME
TWILIO_PHONE_NUMBER=CHANGE_ME
SENDGRID_API_KEY=CHANGE_ME
SENDGRID_FROM_EMAIL=CHANGE_ME
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=CHANGE_ME
AWS_SECRET_ACCESS_KEY=CHANGE_ME
S3_BUCKET=CHANGE_ME
RAZORPAY_KEY_ID=CHANGE_ME
RAZORPAY_KEY_SECRET=CHANGE_ME
EOF

echo ""
echo "IMPORTANT: Edit .env with your real credentials before continuing!"
echo "Run: nano .env"
echo ""
echo "After editing .env, run:"
echo "  sudo docker-compose -f docker-compose.ec2.yml up -d --build"
echo "  sleep 30"
echo "  sudo docker-compose -f docker-compose.ec2.yml exec -T backend npx prisma migrate deploy"
