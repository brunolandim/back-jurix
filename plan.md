# Plano: WhatsApp via wa.me (sem API da Meta)

## Contexto
Quando o advogado cria um link de compartilhamento, queremos que ele possa enviar esse link para o cliente via WhatsApp com um clique — sem custo, sem API da Meta. Usamos o link `wa.me` que abre o WhatsApp do advogado com a mensagem pronta.

## O que já existe
- **Share link creation**: `POST /share-links` → retorna o link com token
- **URL format**: `{APP_URL}/share/{token}`
- **Arquivo não utilizado**: `src/services/whatsapp-link-service.ts` (usa Meta API, nunca é chamado)

## Onde implementar: **Frontend + pequeno ajuste no Backend**

### Backend (pequeno)
1. **Remover** `src/services/whatsapp-link-service.ts` (serviço Meta API não utilizado)
2. **Remover** referências ao `whatsapp-link-service` se houver imports
3. O endpoint `POST /share-links` já retorna o `token` — o frontend monta a URL completa

### Frontend (principal)
Após o advogado criar o share link, exibir um botão **"Enviar via WhatsApp"** que:

1. Monta a mensagem:
   ```
   Olá! Seu advogado compartilhou documentos do seu caso. Acesse pelo link: https://app.jurix.com.br/share/{token}
   ```
2. Abre: `https://wa.me/?text={mensagem_encoded}`
   - Sem número fixo — o advogado escolhe o contato no WhatsApp
3. Opcionalmente, se o caso tiver telefone do cliente, pré-preencher: `https://wa.me/5511999999999?text={mensagem}`

### Parâmetros SSM que podem ser removidos futuramente
- `whatsapp_phone_number_id` → não mais necessário
- `whatsapp_access_token` → não mais necessário
- Os data sources correspondentes no Terraform (`data.tf`)
- As env vars no `locals.env_vars`

## Arquivos afetados

### Backend
- `src/services/whatsapp-link-service.ts` → **remover**
- `src/services/whatsapp-service.ts` → manter (é do sistema de notificações gerais, separado)
- `terraform/data.tf` → remover whatsapp params (futuro)
- `terraform/ssm-params.sh` → remover whatsapp params (futuro)

### Frontend
- Componente de criação/exibição de share link → adicionar botão "Enviar via WhatsApp"
- (depende da estrutura do frontend)

## Verificação
1. Criar um share link no app
2. Clicar em "Enviar via WhatsApp"
3. Verificar que abre o WhatsApp com a mensagem correta e o link funcional

-----------------------------------------------------
1. Acesse dashboard.stripe.com > Settings > Branding                                                                                                             
2. Lá você configura:
   - Logo (aparece no topo esquerdo do checkout)
   - Ícone (favicon)
   - Cor da marca (o botão "Iniciar teste" fica com a cor que você definir)
   - Cor de destaque
   - Nome do negócio (troca "New business" por "Jurix")

Também em Settings > Public details:
- Nome da empresa (Business name)
- Descrição
- Site
- Informações de suporte

Tudo isso é feito direto no painel do Stripe, sem precisar mexer em código. A página de checkout vai refletir automaticamente.
