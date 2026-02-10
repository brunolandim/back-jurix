# Upload com Presigned URL - Implementação Completa

## 🎯 Objetivo
Migrar uploads de base64 (limitado) para Presigned URL (direto no S3, sem limites).

## 📦 Mudanças no Backend

### 1. Schema de Validação (`src/validations/schemas/upload.schema.ts`)
- ✅ Adicionado suporte a PDF
- ✅ Criado `publicPresignedUrlSchema` para uploads públicos

### 2. Use Case (`src/use-cases/private/upload.usecase.ts`)
- ✅ Adicionado `generatePublicPresignedUrl()` - gera URL para upload público
- ✅ Adicionado `confirmPublicUpload()` - confirma que upload foi concluído
- ✅ Validações de token, documento e expiração

### 3. Lambda Pública (`src/functions/public-lambda.ts`)
- ✅ Nova rota: `POST /share-links/:token/upload-url`
  - Retorna: `{ uploadUrl, fileUrl, documentId }`
- ✅ Rota existente mantida: `POST /share-links/:token/upload`
  - Agora só confirma o upload (não faz mais upload)

## 🎨 Mudanças no Frontend

### 1. Helper de Upload (`src/lib/upload.ts`)
- ✅ Criado `uploadWithPresignedUrl()` - função reutilizável
- Encapsula a lógica: pedir URL → upload S3 → retornar fileUrl

### 2. Profile Service (`src/services/profile-service.ts`)
- ✅ Removido `fileToBase64()`
- ✅ Agora usa `uploadWithPresignedUrl()`
- ✅ Chama `/uploads/presigned-url` (já existia no backend)

### 3. Shareable Link Service (`src/services/shareable-link-service.ts`)
- ✅ Removido FormData
- ✅ Agora usa `uploadWithPresignedUrl()`
- ✅ Fluxo: presigned URL → upload S3 → confirmar

## 🔄 Fluxo de Upload

### Upload Privado (Foto de Perfil)
```
Frontend                    Backend                     S3
   |                           |                         |
   |--POST /presigned-url----->|                         |
   |<----{uploadUrl,fileUrl}---|                         |
   |                           |                         |
   |--PUT uploadUrl (file)----------------------------->|
   |<--200 OK-------------------------------------------|
   |                           |                         |
   |--PUT /me {photo:fileUrl}->|                         |
   |<----{lawyer}--------------|                         |
```

### Upload Público (Documentos via Link)
```
Frontend                    Backend                     S3
   |                           |                         |
   |--POST /share-links/:token/upload-url-------------->|
   |<----{uploadUrl,fileUrl,documentId}-----------------|
   |                           |                         |
   |--PUT uploadUrl (file)----------------------------->|
   |<--200 OK-------------------------------------------|
   |                           |                         |
   |--POST /share-links/:token/upload------------------>|
   |  {documentId, fileUrl}    |                         |
   |<----204 No Content--------|                         |
```

## ✅ Vantagens

1. **Sem limite de tamanho** - S3 suporta até 5GB por arquivo
2. **Mais rápido** - Upload direto, não passa pela Lambda
3. **Menos custo** - Lambda não processa o arquivo
4. **Mais eficiente** - Não converte para base64 (+33% tamanho)
5. **Escalável** - S3 gerencia o upload, não a Lambda

## 🧪 Como Testar

### 1. Backend
```bash
cd back-jurix
npm run dev
```

### 2. Frontend
```bash
cd jurix
npm run dev
```

### 3. Testar Upload de Foto
1. Login
2. Ir em Perfil
3. Selecionar foto
4. Verificar no console: 2 requests (presigned-url + PUT S3)

### 4. Testar Upload de Documento
1. Criar caso
2. Adicionar documentos
3. Gerar link compartilhável
4. Abrir link (sem login)
5. Fazer upload
6. Verificar no console: 3 requests (upload-url + PUT S3 + confirm)

## 📝 Notas

- A rota antiga `/uploads` (base64) ainda existe mas não é mais usada
- Pode ser removida no futuro se não houver outros usos
- Presigned URLs expiram em 5 minutos (configurável em `s3.ts`)
