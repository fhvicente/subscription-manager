# Backend do Gestor de Subscrições

Este é o backend simplificado do Gestor de Subscrições, agora utilizando SQLite diretamente como banco de dados em vez do Prisma ORM.

## Tecnologias Utilizadas

- **Node.js** com Express
- **SQLite** para armazenamento de dados
- **JWT** para autenticação
- **bcrypt** para criptografia de senhas

## Estrutura do Projeto

- `/src` - Código fonte principal
  - `/db` - Módulo de banco de dados SQLite e scripts de inicialização
  - `/controllers` - Controladores da API
  - `/routes` - Rotas da API
  - `middleware.js` - Middleware de autenticação
  - `index.js` - Ponto de entrada da aplicação

## Como Usar

1. Instale as dependências:
   ```
   npm install
   ```

2. Crie o arquivo `.env` a partir do exemplo:
   ```
   cp .env.example .env
   ```

3. Inicialize o banco de dados:
   ```
   npm run init-db
   ```

4. Execute o servidor em modo de desenvolvimento:
   ```
   npm run dev
   ```

## Usuários de Teste

- Admin: admin@example.com / admin123
- User: user@example.com / test123

## Rotas da API

### Autenticação
- `POST /api/auth/register` - Registrar um novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter informações do usuário atual (autenticado)

### Usuários
- `GET /api/users/profile` - Obter perfil do usuário (autenticado)
- `PUT /api/users/profile` - Atualizar perfil do usuário (autenticado)

### Subscrições
- `GET /api/subscriptions` - Listar todas as subscrições
- `GET /api/subscriptions/:id` - Obter uma subscrição específica
- `POST /api/subscriptions` - Criar uma nova subscrição
- `PUT /api/subscriptions/:id` - Atualizar uma subscrição
- `DELETE /api/subscriptions/:id` - Excluir uma subscrição

## Banco de Dados

O banco de dados SQLite é armazenado em `/data/database.sqlite`. As tabelas incluem:

- `users` - Usuários do sistema
- `subscriptions` - Subscrições
- `notification_settings` - Configurações de notificação
- `payment_logs` - Logs de pagamento
- `todos` - Lista de tarefas 