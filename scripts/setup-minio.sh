#!/bin/bash

echo "Configurando MinIO..."

# Aguardar MinIO estar pronto
sleep 5

# Configurar alias
mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Criar bucket se não existir
mc mb --ignore-existing myminio/jurix-uploads

# Configurar política pública
mc anonymous set public myminio/jurix-uploads

# Configurar CORS
cat > /tmp/cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

mc anonymous set-json /tmp/cors.json myminio/jurix-uploads

echo "MinIO configurado com sucesso!"
