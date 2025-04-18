# API Documentation - Gestor Simples de Assinaturas

Este documento detalha todos os endpoints da API do Gestor Simples de Assinaturas, incluindo parâmetros, respostas e exemplos.

## Base URL

```
https://api.gestor-assinaturas.com
```

Para desenvolvimento local:
```
http://localhost:3001
```

## Autenticação

Todos os endpoints (exceto webhooks) requerem autenticação via token JWT no cabeçalho Authorization:

```
Authorization: Bearer {seu_token_jwt}
```

O token JWT é obtido automaticamente pelo frontend através da integração com Clerk.

---

## Endpoints

### Assinaturas

#### Listar todas as assinaturas

```
GET /api/subscriptions
```

**Resposta**
```json
[
  {
    "id": "1",
    "userId": "user_123",
    "name": "Netflix",
    "amount": 19.99,
    "renewalDate": "2025-05-15T00:00:00.000Z",
    "frequency": "monthly",
    "category": "Entertainment",
    "active": true,
    "createdAt": "2025-04-15T14:30:00.000Z",
    "updatedAt": "2025-04-15T14:30:00.000Z"
  },
  {
    "id": "2",
    "userId": "user_123",
    "name": "Spotify",
    "amount": 9.99,
    "renewalDate": "2025-04-28T00:00:00.000Z",
    "frequency": "monthly",
    "category": "Music",
    "active": true,
    "createdAt": "2025-04-15T14:35:00.000Z",
    "updatedAt": "2025-04-15T14:35:00.000Z"
  }
]
```

#### Criar nova assinatura

```
POST /api/subscriptions
```

**Corpo da requisição**
```json
{
  "name": "Disney+",
  "amount": 14.99,
  "renewalDate": "2025-05-10T00:00:00.000Z",
  "frequency": "monthly",
  "category": "Entertainment",
  "active": true
}
```

**Resposta (201 Created)**
```json
{
  "id": "3",
  "userId": "user_123",
  "name": "Disney+",
  "amount": 14.99,
  "renewalDate": "2025-05-10T00:00:00.000Z",
  "frequency": "monthly",
  "category": "Entertainment",
  "active": true,
  "createdAt": "2025-04-16T15:00:00.000Z",
  "updatedAt": "2025-04-16T15:00:00.000Z"
}
```

#### Obter detalhes de uma assinatura

```
GET /api/subscriptions/:id
```

**Resposta**
```json
{
  "id": "1",
  "userId": "user_123",
  "name": "Netflix",
  "amount": 19.99,
  "renewalDate": "2025-05-15T00:00:00.000Z",
  "frequency": "monthly",
  "category": "Entertainment",
  "active": true,
  "createdAt": "2025-04-15T14:30:00.000Z",
  "updatedAt": "2025-04-15T14:30:00.000Z"
}
```

#### Atualizar uma assinatura

```
PUT /api/subscriptions/:id
```

**Corpo da requisição**
```json
{
  "name": "Netflix Premium",
  "amount": 21.99
}
```

**Resposta**
```json
{
  "id": "1",
  "userId": "user_123",
  "name": "Netflix Premium",
  "amount": 21.99,
  "renewalDate": "2025-05-15T00:00:00.000Z",
  "frequency": "monthly",
  "category": "Entertainment",
  "active": true,
  "createdAt": "2025-04-15T14:30:00.000Z",
  "updatedAt": "2025-04-16T15:10:00.000Z"
}
```

#### Excluir uma assinatura

```
DELETE /api/subscriptions/:id
```

**Resposta (200 OK)**
```json
{
  "message": "Subscription deleted successfully"
}
```

#### Obter estatísticas de assinaturas

```
GET /api/subscriptions/stats
```

**Resposta**
```json
{
  "totalMonthly": 46.97,
  "totalYearly": 563.64,
  "totalCount": 3,
  "categorySummary": [
    {
      "category": "Entertainment",
      "count": 2,
      "totalAmount": 36.98
    },
    {
      "category": "Music",
      "count": 1,
      "totalAmount": 9.99
    }
  ],
  "upcomingRenewals": [
    {
      "id": "2",
      "name": "Spotify",
      "renewalDate": "2025-04-28T00:00:00.000Z",
      "amount": 9.99
    }
  ]
}
```

### Notificações

#### Obter configurações de notificação

```
GET /api/notifications
```

**Resposta**
```json
{
  "userId": "user_123",
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": false,
  "daysBeforeRenewal": 3,
  "phoneNumber": null,
  "createdAt": "2025-04-15T14:30:00.000Z",
  "updatedAt": "2025-04-15T14:30:00.000Z"
}
```

#### Atualizar configurações de notificação

```
PUT /api/notifications
```

**Corpo da requisição**
```json
{
  "emailEnabled": true,
  "smsEnabled": true,
  "pushEnabled": false,
  "daysBeforeRenewal": 5,
  "phoneNumber": "+5511999999999"
}
```

**Resposta**
```json
{
  "userId": "user_123",
  "emailEnabled": true,
  "smsEnabled": true,
  "pushEnabled": false,
  "daysBeforeRenewal": 5,
  "phoneNumber": "+5511999999999",
  "createdAt": "2025-04-15T14:30:00.000Z",
  "updatedAt": "2025-04-16T15:15:00.000Z"
}
```

#### Enviar notificação de teste

```
POST /api/notifications/test
```

**Corpo da requisição**
```json
{
  "type": "email"
}
```

**Resposta**
```json
{
  "success": true,
  "message": "Test email notification sent successfully"
}
```

#### Verificar renovações próximas (para cron)

```
POST /api/notifications/check-renewals
```

**Cabeçalhos**
```
x-api-key: your_secure_cron_api_key
```

**Resposta**
```json
{
  "success": true,
  "notificationsSent": 1,
  "details": [
    {
      "subscriptionId": "2",
      "subscriptionName": "Spotify",
      "userId": "user_123",
      "renewalDate": "2025-04-28T00:00:00.000Z"
    }
  ]
}
```

### Pagamentos

#### Criar sessão de checkout do Stripe

```
POST /api/payments/create-checkout-session
```

**Corpo da requisição**
```json
{
  "plan": "monthly"
}
```

**Resposta**
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0",
  "url": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0"
}
```

#### Webhook do Stripe para eventos de pagamento

```
POST /api/payments/webhook
```

Este endpoint é chamado pelo Stripe e não deve ser chamado diretamente.

#### Obter histórico de pagamentos

```
GET /api/payments/history
```

**Resposta**
```json
[
  {
    "id": "1",
    "userId": "user_123",
    "amount": 9.90,
    "status": "success",
    "stripeSessionId": "cs_live_a1b2c3d4e5f6g7h8i9j0",
    "plan": "monthly",
    "createdAt": "2025-04-15T16:00:00.000Z"
  }
]
```

#### Obter status da assinatura premium

```
GET /api/payments/subscription-status
```

**Resposta**
```json
{
  "plan": "premium",
  "premiumUntil": "2025-05-15T16:00:00.000Z",
  "isActive": true
}
```

### Usuários

#### Obter perfil do usuário

```
GET /api/users/profile
```

**Resposta**
```json
{
  "id": "user_123",
  "email": "usuario@exemplo.com",
  "name": "Usuário Exemplo",
  "plan": "premium",
  "premiumUntil": "2025-05-15T16:00:00.000Z",
  "createdAt": "2025-04-01T12:00:00.000Z",
  "updatedAt": "2025-04-15T16:00:00.000Z"
}
```

#### Atualizar perfil do usuário

```
PUT /api/users/profile
```

**Corpo da requisição**
```json
{
  "name": "Novo Nome do Usuário"
}
```

**Resposta**
```json
{
  "id": "user_123",
  "email": "usuario@exemplo.com",
  "name": "Novo Nome do Usuário",
  "plan": "premium",
  "premiumUntil": "2025-05-15T16:00:00.000Z",
  "createdAt": "2025-04-01T12:00:00.000Z",
  "updatedAt": "2025-04-16T15:20:00.000Z"
}
```

## Códigos de Erro

- `400 Bad Request` - Requisição inválida ou parâmetros faltando
- `401 Unauthorized` - Autenticação necessária ou token inválido
- `403 Forbidden` - Permissão negada para o recurso
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro interno do servidor

## Limites de Taxa

- Plano gratuito: 100 requisições por minuto
- Plano premium: 500 requisições por minuto
