# 🎮 E-Commerce Games - Plataforma Profissional

Uma plataforma de e-commerce premium para venda de games, com design inspirado em Nuuvem, arquitetura escalável e recursos enterprise-ready.

## ✨ Recursos Principais

### 💳 Sistema de Pagamento
- Integração com Mercado Pago
- Processamento de pagamentos seguro
- Sistema de reembolso automático
- Webhook handling para confirmações

### 🤖 Inteligência Artificial
- Sistema de recomendações personalizado
- Produtos em tendência
- Recomendações por comportamento
- Cache inteligente com TTL

### 📊 Analytics & Dashboards
- Dashboard executivo com 9 métricas
- Análise de receita por período
- Segmentação de clientes
- Funil de conversão
- Relatórios detalhados

### 🌙 Dark Mode
- Tema escuro profissional
- CSS Variables dinâmicas
- Toggle automático
- Paletas preto e vermelho

### 👥 Painel Administrativo
- Gerenciamento completo de usuários
- Controle de produtos
- Monitoramento de pedidos
- Analytics em tempo real
- Logs de auditoria

### 🔐 Segurança
- Autenticação JWT
- Controle de acesso por roles (RBAC)
- Bcrypt para senhas
- Prepared statements contra SQL Injection
- Auditoria de ações admin

## 🏗️ Arquitetura

### Padrões de Design
- **DDD** - Domain-Driven Design
- **SOLID** - Princípios SOLID
- **Repository Pattern** - Abstração de dados
- **Service Layer** - Lógica de negócio isolada

### Estrutura de Pastas
```
e-comerce/
├── backend/
│   ├── features/
│   │   ├── orders/           # Pedidos
│   │   ├── payments/         # Pagamentos
│   │   ├── recommendations/  # Recomendações
│   │   ├── analytics/        # Analytics
│   │   └── users/            # Usuários Admin
│   ├── core/
│   │   ├── middleware/       # Autenticação, autorização
│   │   └── config/
│   ├── shared/
│   │   ├── utils/            # Cache, helpers
│   │   └── services/         # Serviços globais
│   └── server.js             # Express app
├── frontend/
│   ├── pages/                # Páginas principais
│   ├── components/           # Componentes Vue
│   ├── assets/               # Estilos e recursos
│   └── App.vue               # App principal
├── database/
│   ├── schema.sql            # Schema normalizado
│   └── db.js                 # Conexão MySQL
└── package.json
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js v16+
- MySQL 8.0+
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/e-comerce-games.git
cd e-comerce-games
```

2. **Instale dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp .env.example .env
```

4. **Setup do Banco de Dados**
```bash
mysql -u root -p2332 < database/schema.sql
```

5. **Inicie o servidor**
```bash
npm start
```

## 📚 Endpoints da API

### Autenticação
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/register
```

### Produtos
```
GET    /api/products
GET    /api/products/:id
POST   /api/admin/products      (Admin)
PUT    /api/admin/products/:id  (Admin)
DELETE /api/admin/products/:id  (Admin)
```

### Pedidos
```
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
```

### Pagamentos
```
POST   /api/payments/preference
POST   /api/payments/webhook
GET    /api/payments/status/:id
```

### Recomendações
```
GET    /api/recommendations
GET    /api/trending
GET    /api/similar/:id
```

### Analytics (Admin)
```
GET    /api/analytics/dashboard
GET    /api/analytics/revenue
GET    /api/analytics/customers
GET    /api/analytics/funnel
```

### Usuários (Admin)
```
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
```

## 🎨 Interface

### Páginas Principais
- **Home** - Catálogo com filtros e busca
- **Produto** - Detalhes, recomendações, comentários
- **Carrinho** - Revisão de pedidos
- **Checkout** - Endereço, pagamento
- **Pedidos** - Histórico e status

### Painel Admin (`/admin`)
- **Dashboard** - KPIs e gráficos
- **Usuários** - CRUD e filtros avançados
- **Produtos** - Gerenciamento de cards
- **Pedidos** - Status e fulfillment
- **Analytics** - Relatórios detalhados

## 🛡️ Segurança

- ✅ JWT com 7 dias de expiração
- ✅ RBAC - 3 roles (customer, moderator, admin)
- ✅ Bcrypt 10 rounds para senhas
- ✅ Prepared statements em SQL
- ✅ CORS configurado
- ✅ Auditoria de ações admin

## 📊 Banco de Dados

### Tabelas Principais
- `users` - Usuários da plataforma
- `products` - Catálogo de games
- `orders` - Pedidos
- `order_items` - Itens dos pedidos
- `payments` - Histórico de pagamentos
- `admin_logs` - Auditoria de ações
- `recommendations` - Cache de recomendações

## 📝 Variáveis de Ambiente

```env
PORT=5000
NODE_ENV=production

MYSQL_HOST=localhost
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=ecommerce_games

JWT_SECRET=sua_chave_secreta
JWT_EXPIRATION=7d

MERCADO_PAGO_ACCESS_TOKEN=TEST-TOKEN
```

## 📦 Dependências Principais

- Express
- Vue 3
- MySQL2
- JWT
- Bcrypt
- Mercado Pago SDK

## 🚀 Deploy

```bash
# Heroku
git push heroku main

# DigitalOcean / AWS
npm install && npm start
```

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ para e-commerce profissional**
