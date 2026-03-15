# E-Commerce Games

## Descrição

Plataforma profissional de e-commerce para venda de jogos com integração ao Mercado Pago, modo escuro, analytics e painel administrativo.

## Funcionalidades

- **Autenticação de Usuários**: Login, registro e gerenciamento de contas.
- **Catálogo de Produtos**: Listagem, busca e filtros por categoria.
- **Carrinho de Compras**: Adição, remoção e atualização de itens.
- **Sistema de Pedidos**: Processamento e rastreamento de pedidos.
- **Pagamentos**: Integração com Mercado Pago para transações seguras.
- **Avaliações**: Sistema de reviews para produtos.
- **Recomendações**: Sugestões personalizadas de produtos.
- **Analytics**: Relatórios e estatísticas para administradores.
- **Painel Administrativo**: Gerenciamento de produtos, pedidos e usuários.
- **Modo Escuro**: Interface adaptável ao tema preferido.
- **Design Responsivo**: Compatível com dispositivos móveis e desktop.

## Tecnologias Utilizadas

### Backend
- **Node.js**: Ambiente de execução JavaScript no servidor.
- **Express.js**: Framework web para Node.js.
- **MySQL**: Banco de dados relacional.
- **JWT (JSON Web Tokens)**: Autenticação segura.
- **bcryptjs**: Hashing de senhas.
- **Mercado Pago SDK**: Integração de pagamentos.
- **Multer**: Upload de arquivos.
- **CORS**: Controle de acesso cross-origin.
- **UUID**: Geração de identificadores únicos.

### Frontend
- **Vue.js 3**: Framework JavaScript para interfaces de usuário.
- **Axios**: Cliente HTTP para requisições API.
- **CSS**: Estilização com suporte a modo escuro.

### Outros
- **Dotenv**: Gerenciamento de variáveis de ambiente.
- **Git**: Controle de versão.

## Estrutura do Projeto

```
e-comerce/
├── backend/
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── features/
│   │   ├── auth/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── products/
│   │   ├── recommendations/
│   │   ├── analytics/
│   │   └── users/
│   └── core/
│       ├── middleware/
│       └── errors/
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── components/
│   └── pages/
├── database/
│   └── schema.sql
├── .env
├── .gitignore
└── package.json
```

## Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd e-comerce
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o banco de dados MySQL e atualize as variáveis em `.env`:
   ```
   MYSQL_HOST=localhost
   MYSQL_USER=seu_usuario
   MYSQL_PASSWORD=sua_senha
   MYSQL_DATABASE=ecommerce_games
   MYSQL_PORT=3306
   JWT_SECRET=sua_chave_secreta
   MERCADO_PAGO_ACCESS_TOKEN=seu_token
   ```

4. Execute o schema do banco:
   ```bash
   mysql -u seu_usuario -p ecommerce_games < database/schema.sql
   ```

5. Inicie o servidor:
   ```bash
   npm start
   ```

6. Acesse no navegador: `http://localhost:5000`

## Uso

- **Usuários**: Navegue pelos produtos, adicione ao carrinho e finalize compras.
- **Administradores**: Acesse o painel em `/admin` para gerenciar produtos e visualizar analytics.

## Contribuição

1. Fork o projeto.
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`.
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`.
4. Push para a branch: `git push origin feature/nova-funcionalidade`.
5. Abra um Pull Request.

## Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

Para dúvidas ou sugestões, entre em contato com o autor.