#!/bin/bash
set -e

VERSION="1.8.4"
INSTALL_DIR="/usr/local/bin"

echo "📦 Baixando Terraform v$VERSION..."
cd /tmp
curl -LO https://releases.hashicorp.com/terraform/${VERSION}/terraform_${VERSION}_linux_amd64.zip

echo "📁 Extraindo e instalando..."
sudo apt install unzip -y
unzip terraform_${VERSION}_linux_amd64.zip
sudo mv terraform $INSTALL_DIR/
rm terraform_${VERSION}_linux_amd64.zip

echo "✅ Verificação:"
terraform -version
