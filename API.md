# API Routes

**Base URL dev:** `http://localhost:3000`

**Header de autenticação:** `Authorization: Bearer <token>`

## Autenticação (Pública)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth` | Login |
| POST | `/auth/login` | Login (alternativo) |

## Usuário Logado

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/me` | Dados do usuário autenticado |

## Organizations

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/organizations` | Listar organização |
| PUT | `/organizations` | Atualizar organização |

## Lawyers (Advogados)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/lawyers` | Listar advogados |
| POST | `/lawyers` | Criar advogado |
| GET | `/lawyers/:id` | Buscar advogado |
| PUT | `/lawyers/:id` | Atualizar advogado |
| DELETE | `/lawyers/:id` | Remover advogado |

## Columns (Colunas do Kanban)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/columns` | Listar colunas |
| POST | `/columns` | Criar coluna |
| PUT | `/columns/:id` | Atualizar coluna |
| DELETE | `/columns/:id` | Remover coluna |

## Cases (Processos)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/cases` | Listar processos |
| POST | `/cases` | Criar processo |
| GET | `/cases/:id` | Buscar processo |
| PUT | `/cases/:id` | Atualizar processo |
| DELETE | `/cases/:id` | Remover processo |
| PATCH | `/cases/:id/move` | Mover para outra coluna |
| PATCH | `/cases/:id/assign` | Atribuir advogado |

## Documents (Documentos)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/documents?caseId=:id` | Listar documentos do caso |
| POST | `/documents` | Criar documento |
| PUT | `/documents/:id` | Atualizar documento |
| DELETE | `/documents/:id` | Remover documento |
| PATCH | `/documents/:id/approve` | Aprovar documento |
| PATCH | `/documents/:id/reject` | Rejeitar documento |

## Notifications

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/notifications` | Listar notificações |
| POST | `/notifications` | Criar notificação |
| DELETE | `/notifications/:id` | Remover notificação |
| PATCH | `/notifications/:id/read` | Marcar como lida |
| PATCH | `/notifications/read-all` | Marcar todas como lidas |

## Share Links (Links de Compartilhamento)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/share-links` | Criar link (autenticado) |
| GET | `/share-links/:token` | Acessar link (público) |
| POST | `/share-links/:token/upload` | Upload via link (público) |
