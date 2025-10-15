# Configuração da Autenticação Google

## Variáveis de Ambiente Necessárias

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=410388314523-jviad34c62t5volbdch42of9o5or9qsj.apps.googleusercontent.com
NEXTAUTH_SECRET=X0vnhbDhl9eqxVn1ZVf0pAbC8m0dpbZk5eTn2PuZs3s=

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Como Configurar o Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google+ ou Google Identity
4. Vá para "Credenciais" e clique em "Criar credenciais" > "ID do cliente OAuth 2.0"
5. Configure os URIs de redirecionamento:
   - Para desenvolvimento: `http://localhost:3000/api/auth/callback/google`
   - Para produção: `https://seudominio.com/api/auth/callback/google`
6. Copie o Client ID e Client Secret para o arquivo `.env.local`

## Fluxo de Cadastro com Google

1. Usuário clica em "Continuar com Google"
2. É redirecionado para o Google para autenticação
3. Após autenticação, retorna para a página de cadastro
4. Sistema mostra formulário para escolher usuário e senha
5. Usuário completa o cadastro com os dados do Google + credenciais escolhidas

## Estrutura do Banco de Dados

O NextAuth criará automaticamente as seguintes coleções no MongoDB:
- `users` - Dados dos usuários
- `accounts` - Contas vinculadas (Google)
- `sessions` - Sessões ativas

Campos adicionais na coleção `users`:
- `googleId` - ID do Google
- `email` - Email do Google
- `authProvider` - "google" ou "local"
- `permissao` - "usuario" ou "administrador"
