# Gestor Simples de Assinaturas

Um aplicativo de gerenciamento de assinaturas para ajudar você a controlar seus gastos e evitar cobranças desnecessárias.

![Gestor Simples de Assinaturas](https://placehold.co/600x400/png?text=Gestor+Simples+de+Assinaturas)

## Sobre o Projeto

Gestor Simples de Assinaturas é uma aplicação full-stack que permite aos usuários rastrear e gerenciar suas assinaturas de serviços, receber notificações de renovação e visualizar relatórios de gastos. O objetivo é ajudar os usuários a evitar cobranças desnecessárias e ter uma visão clara de seus gastos recorrentes.

### Funcionalidades Principais

- Gerenciamento completo de assinaturas (adicionar, editar, excluir)
- Dashboard com calendário de renovações e gráficos de gastos
- Notificações automáticas de renovação
- Relatórios de gastos por categoria
- Modelo freemium (nível gratuito com recursos limitados)

## Tecnologias Utilizadas

### Frontend
- Next.js com TypeScript
- TailwindCSS e ShadCN UI para estilização
- Chart.js para visualizações e gráficos
- Clerk para autenticação
- Plausible para analytics

### Backend
- Node.js com Express
- PostgreSQL como banco de dados
- Prisma ORM para acesso ao banco de dados
- SendGrid para envio de emails
- Stripe para processamento de pagamentos

## Pré-requisitos

- Node.js 20.x ou superior
- PostgreSQL 15.x ou superior
- Contas de serviço:
  - Clerk (autenticação)
  - SendGrid (emails)
  - Stripe (pagamentos)
  - Plausible (analytics)

## Instalação e Configuração

### Usando Docker (Recomendado)

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/gestor-simples-assinaturas.git
   cd gestor-simples-assinaturas
   ```

2. Configure as variáveis de ambiente:
   - Copie os arquivos `.env.example` para `.env` tanto no diretório `backend` quanto no `frontend`
   - Preencha as variáveis com suas credenciais e configurações

3. Inicie os contêineres com Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Acesse a aplicação em `http://localhost:3000`

### Instalação Manual

#### Backend

1. Navegue até o diretório do backend:
   ```bash
   cd gestor-simples-assinaturas/backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env`
   - Preencha as variáveis com suas credenciais e configurações

4. Execute as migrações do banco de dados:
   ```bash
   npx prisma migrate dev
   ```

5. Inicie o servidor:
   ```bash
   npm run dev
   ```

#### Frontend

1. Navegue até o diretório do frontend:
   ```bash
   cd gestor-simples-assinaturas/frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Copie `.env.local.example` para `.env.local`
   - Preencha as variáveis com suas credenciais e configurações

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Acesse a aplicação em `http://localhost:3000`

## Estrutura do Projeto

```
gestor-simples-assinaturas/
├── backend/                  # API Node.js/Express
│   ├── prisma/               # Esquema e migrações do Prisma
│   ├── src/
│   │   ├── controllers/      # Controladores da API
│   │   ├── middleware/       # Middlewares (auth, etc.)
│   │   ├── routes/           # Rotas da API
│   │   ├── services/         # Serviços (email, pagamento)
│   │   └── utils/            # Utilitários
│   └── tests/                # Testes da API
├── frontend/                 # Aplicação Next.js
│   ├── public/               # Arquivos estáticos
│   └── src/
│       ├── app/              # Páginas e layouts
│       ├── components/       # Componentes React
│       ├── hooks/            # Hooks personalizados
│       └── lib/              # Bibliotecas e utilitários
└── docker-compose.yml        # Configuração Docker
```

## API Endpoints

### Autenticação
- `POST /api/auth/webhook` - Webhook do Clerk para eventos de autenticação

### Assinaturas
- `GET /api/subscriptions` - Listar todas as assinaturas do usuário
- `POST /api/subscriptions` - Criar nova assinatura
- `GET /api/subscriptions/:id` - Obter detalhes de uma assinatura
- `PUT /api/subscriptions/:id` - Atualizar uma assinatura
- `DELETE /api/subscriptions/:id` - Excluir uma assinatura
- `GET /api/subscriptions/stats` - Obter estatísticas de assinaturas

### Notificações
- `GET /api/notifications` - Obter configurações de notificação
- `PUT /api/notifications` - Atualizar configurações de notificação
- `POST /api/notifications/test` - Enviar notificação de teste
- `POST /api/notifications/check-renewals` - Verificar renovações próximas (para cron)

### Pagamentos
- `POST /api/payments/create-checkout-session` - Criar sessão de checkout do Stripe
- `POST /api/payments/webhook` - Webhook do Stripe para eventos de pagamento
- `GET /api/payments/history` - Obter histórico de pagamentos
- `GET /api/payments/subscription-status` - Obter status da assinatura premium

### Usuários
- `GET /api/users/profile` - Obter perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil do usuário

## Deployment

Para informações detalhadas sobre como implantar a aplicação em ambiente de produção, consulte o arquivo [deployment.md](deployment.md).

## Testes

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

Seu Nome - seu.email@exemplo.com

Link do Projeto: [https://github.com/seu-usuario/gestor-simples-assinaturas](https://github.com/seu-usuario/gestor-simples-assinaturas)
