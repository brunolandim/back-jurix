# Jurix Backend

Backend API para o sistema de gestão jurídica Jurix, construído com Node.js, TypeScript e PostgreSQL, pronto para deploy como AWS Lambda.

## Estrutura do Projeto

```
back-jurix/
├── src/
│   ├── handlers/          # Lambda handlers (entry points)
│   ├── core/              # Use cases (lógica de negócio)
│   ├── domain/            # Entities, enums e errors
│   ├── infra/             # Database, storage, cache
│   ├── shared/            # Middleware, validators, utils
│   └── config/            # Configurações
├── scripts/               # Scripts de migration e seed
├── terraform/             # Infraestrutura AWS (a ser criado)
└── tests/                 # Testes
```

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- pnpm, npm ou yarn

## Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações
```

## Banco de Dados

```bash
# Criar banco de dados
createdb jurix

# Executar migrations
npm run migrate

# Popular com dados iniciais
npm run seed
```

## Desenvolvimento

```bash
# Iniciar servidor local
npm run dev

# O servidor estará disponível em http://localhost:3001
```

## Login Padrão

Após executar o seed:
- **Email:** admin@jurix.com
- **Senha:** admin123

## Endpoints da API

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Dados do usuário logado |

### Organização
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/organization | Obter organização |
| PUT | /api/organization | Atualizar organização |

### Advogados
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/lawyers | Listar advogados |
| GET | /api/lawyers/:id | Buscar advogado |
| POST | /api/lawyers | Criar advogado |
| PUT | /api/lawyers/:id | Atualizar advogado |
| DELETE | /api/lawyers/:id | Excluir advogado |

### Colunas (Kanban)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/columns | Listar colunas com casos |
| POST | /api/columns | Criar coluna |
| PUT | /api/columns/:id | Atualizar coluna |
| DELETE | /api/columns/:id | Excluir coluna |

### Casos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/cases | Listar casos |
| GET | /api/cases/:id | Buscar caso |
| POST | /api/cases | Criar caso |
| PUT | /api/cases/:id | Atualizar caso |
| PATCH | /api/cases/:id/move | Mover caso |
| PATCH | /api/cases/:id/assign | Atribuir advogado |
| DELETE | /api/cases/:id | Excluir caso |

### Documentos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/cases/:caseId/documents | Listar documentos |
| POST | /api/cases/:caseId/documents | Solicitar documento |
| PUT | /api/cases/:caseId/documents/:id | Atualizar documento |
| POST | /api/cases/:caseId/documents/:id/approve | Aprovar documento |
| POST | /api/cases/:caseId/documents/:id/reject | Rejeitar documento |
| DELETE | /api/cases/:caseId/documents/:id | Excluir documento |

### Notificações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/notifications | Listar notificações |
| POST | /api/cases/:caseId/notifications | Criar notificação |
| PUT | /api/notifications/:id/read | Marcar como lida |
| PUT | /api/notifications/read-all | Marcar todas como lidas |
| DELETE | /api/notifications/:id | Excluir notificação |

### Links Compartilháveis
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/share-link | Criar link |
| GET | /api/share-link/:token | Obter dados do link |
| POST | /api/share-link/:token/upload/:docId | Upload de documento |

## Build

```bash
# Build para Lambda
npm run build

# Output em dist/handlers/
```

## Testes

```bash
npm test
```

## Deploy AWS

O deploy será feito via Terraform (a ser implementado). A infraestrutura incluirá:

- API Gateway
- Lambda Functions
- RDS PostgreSQL
- S3 para uploads
- Secrets Manager
- VPC com subnets privadas
