# Debug: Busca de Usuários Não Aparece

## 🔍 Problema
Ao clicar em "Nova Conversa" e buscar usuários no painel de mensagens do admin, os usuários encontrados não aparecem na lista.

## ✅ Logs Adicionados

### No Front-End (`src/app/painel/mensagens/page.tsx`):
1. Logs detalhados na função `handleBuscarUsuarios`:
   - Query sendo enviada
   - URL da requisição
   - Status da resposta
   - Dados recebidos completos
   - Estado atualizado

2. Logs na renderização:
   - Tamanho do array `usuariosEncontrados`
   - Conteúdo do array

### No Back-End (`src/pages/api/buscar-usuarios.ts`):
1. Total de usuários no banco
2. Contagem de usuários encontrados
3. Dados dos usuários em JSON formatado
4. Se não encontrar nada, lista todos os usuários do banco (limit 20)

## 🐛 Possíveis Causas

### 1. Problema no Back-End
- API retorna erro 403 (sem permissão)
- API retorna erro 400 (query inválida)
- API retorna sucesso mas array vazio

### 2. Problema no Front-End
- Estado não está atualizando
- Renderização condicional não funciona
- Array existe mas está vazio

### 3. Problema de Dados
- Não há usuários no banco
- Todos os usuários são admin (filtered out)
- Query está muito restritiva

## 🧪 Como Testar

1. Abrir o painel de mensagens como admin
2. Clicar em "Nova Conversa"
3. Digitar algo na busca (ex: "a")
4. Abrir o DevTools (F12)
5. Ir para a aba Console
6. Verificar os logs:
   - `🔍 Iniciando busca de usuários com query: ...`
   - `🌐 Fazendo requisição para: ...`
   - `📡 Resposta recebida: ...`
   - `📊 Dados recebidos: ...`
   - `🔍 Renderizando lista: usuariosEncontrados.length = ...`

## 🔧 Próximos Passos

Com os logs, vamos conseguir identificar:
1. Se a API está retornando os dados corretos
2. Se o front-end está recebendo os dados
3. Se o estado está atualizando
4. Se a renderização está funcionando

## 📝 Notas

- Os logs estão com emojis para facilitar a visualização
- Logs começam com `🔍` (debug), `✅` (sucesso), `❌` (erro)
- Todos os logs importantes estão prefixados


