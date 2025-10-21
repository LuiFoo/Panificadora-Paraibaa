# 🧪 GUIA DE TESTE - Login Google e Permissão Suprema

**Data:** 21 de Outubro de 2025  
**Status:** ✅ Correções Aplicadas

---

## 🔧 CORREÇÕES APLICADAS

### Problema Identificado
❌ Header não atualizava após login com Google  
❌ Permissão Suprema não aparecia (campos não retornados pela API)

### Solução Implementada
✅ APIs agora retornam `permissaoSuprema` e `ExIlimitada`  
✅ `useAuthSync` sem debounce (sincronização instantânea)  
✅ Eventos com verificações múltiplas (0ms, 100ms, 300ms)  
✅ Logs detalhados para debug  

---

## 🧪 TESTE PASSO A PASSO

### 1️⃣ Preparação
1. Abra o **Console do navegador** (F12)
2. Vá para aba **Console**
3. Deixe aberto para ver os logs

### 2️⃣ Fazer Logout
1. Clique no seu **nome** no header (canto direito)
2. Clique em **"Sair"**
3. **Observe no console:**
   ```
   🔓 Usuário deslogado - sessão limpa
   📡 Eventos disparados
   ```

### 3️⃣ Fazer Login com Google
1. Clique em **"Entrar com Google"**
2. Selecione sua conta Google
3. **Observe no console após voltar:**
   ```
   🔄 useAuthSync: syncUserData chamado
   ✅ useAuthSync: Usuário autenticado detectado
   🔄 useAuthSync: Buscando dados do usuário...
   💾 useAuthSync: Salvando usuário no localStorage:
      - permissaoSuprema: "true"
      - ExIlimitada: "true"
   📡 useAuthSync: Disparando eventos...
   📡 useAuthSync: Eventos disparados!
   🔔 UserContext: Evento userLoggedIn recebido!
   ✅ UserContext: Usuário detectado no localStorage
   ```

### 4️⃣ Verificar Header
**O header deve atualizar INSTANTANEAMENTE mostrando:**
- Seu nome (LuiFoo)
- Ícone de usuário
- Menu dropdown funcionando

### 5️⃣ Acessar Painel de Usuários
1. Clique no **ícone de menu** (☰)
2. Clique em **"👥 Usuários"**
3. **Você deve ver:**

```
╔═══════════════════════════════════════════════╗
║ 👥 Gerenciar Usuários                 2 usuários║
║                                               ║
║ ⭐ Você tem Permissão Suprema e pode          ║
║    promover/rebaixar administradores          ║
╠═══════════════════════════════════════════════╣
║ Total: 2  │ ⭐ Super: 1  │ 👑: 1  │ 👤: 1    ║
╠═══════════════════════════════════════════════╣
║ LuiFoo                    ⭐ SUPER ADMIN      ║
║ 👑 Admin                                      ║
║ [⬇️ Remover Admin] [🗑️ Deletar]             ║
║                                               ║
║ Luiz Guilherme                                ║
║ 👤 Usuário                                   ║
║ [⬆️ Promover Admin] [🗑️ Deletar]            ║
╚═══════════════════════════════════════════════╝
```

### 6️⃣ Testar Promoção
1. Clique em **"⬆️ Promover Admin"** no usuário "Luiz Guilherme"
2. **Observe o modal de confirmação**
3. Clique em **"Confirmar"**
4. **Deve aparecer:**
   - ✅ Mensagem de sucesso
   - Badge mudou de "👤 Usuário" para "👑 Admin"
   - Botão mudou de verde (promover) para amarelo (remover)

---

## 🔍 O QUE OBSERVAR NO CONSOLE

### Logs Esperados ao Fazer Login

```
🔄 useAuthSync: syncUserData chamado. Status: authenticated
✅ useAuthSync: Usuário autenticado detectado: luizgrbt@gmail.com
🔄 useAuthSync: Buscando dados do usuário do banco...
Buscando usuário com Google ID: 109626737442227021361
Usuário encontrado: luizgrbt@gmail.com
💾 useAuthSync: Salvando usuário no localStorage: {
  login: 'luizgrbt',
  permissaoSuprema: 'true',
  ExIlimitada: 'true'
}
📡 useAuthSync: Disparando eventos de sincronização...
📡 useAuthSync: Eventos disparados!
✅ useAuthSync: Usuário sincronizado com dados do MongoDB
🔔 UserContext: Evento userLoggedIn recebido!
✅ UserContext: Usuário detectado no localStorage: LuiFoo
```

### Se NÃO Ver Esses Logs

**Problema 1:** Não aparece "Buscando dados do usuário"
- ❌ `useAuthSync` não está executando
- **Solução:** Verifique se `AuthSync` está no layout.tsx

**Problema 2:** Aparece "Usuário não encontrado"
- ❌ Banco de dados não tem seus dados
- **Solução:** Verifique MongoDB

**Problema 3:** Não aparece "permissaoSuprema" no log
- ❌ API não está retornando o campo
- **Solução:** Verifique se fez deploy das mudanças

---

## 🐛 TROUBLESHOOTING

### Problema: Header não atualiza após login

**Verificação 1 - Console:**
- ✅ Vê "Eventos disparados!" → Eventos OK
- ❌ Não vê "Evento recebido" → Listener não funcionando

**Solução:** 
- F5 para recarregar completamente
- Limpar cache do navegador
- Tentar em aba anônima

**Verificação 2 - localStorage:**
1. Console → Application → Local Storage
2. Verifique se tem chave "usuario"
3. Verifique se tem `permissaoSuprema: "true"`

**Se não tiver:**
- API não retornou os dados
- Faça deploy novamente

**Verificação 3 - Network:**
1. Console → Network
2. Após login, busque por "get-user-data"
3. Veja a resposta
4. Deve ter `permissaoSuprema` e `ExIlimitada`

---

## ✅ CHECKLIST

### Antes de Testar
- [ ] Código foi commitado
- [ ] Deploy foi feito (Vercel)
- [ ] MongoDB tem `permissaoSuprema: "true"` no seu usuário
- [ ] Console do navegador está aberto (F12)

### Durante o Teste
- [ ] Logout bem-sucedido
- [ ] Login com Google redirecionou
- [ ] Voltou para a aplicação
- [ ] Vê logs no console
- [ ] Header atualizou (nome aparece)

### Verificar Permissão Suprema
- [ ] Acessa /painel/usuarios
- [ ] Vê aviso "⭐ Você tem Permissão Suprema"
- [ ] Vê card "Super Admins: 1"
- [ ] Vê badge "⭐ SUPER ADMIN" no seu nome
- [ ] Vê botões de promover/rebaixar

---

## 📊 RESULTADOS ESPERADOS

### Timing

| Ação | Tempo Esperado |
|------|----------------|
| Login com Google | 2-3 segundos (Google OAuth) |
| Atualização do Header | **INSTANTÂNEO** (0-300ms) |
| Carregar painel | < 1 segundo |
| Atualizar permissão | < 500ms |

### Visual

**Header após login:**
```
Logo    🏪 Produtos  📞 Fale  ℹ️ Quem    🛒 Cart   👤 LuiFoo ▼
```

**Painel de usuários:**
- Badge "⭐ SUPER ADMIN" visível
- Card com "Super Admins: 1"
- Botões verdes e amarelos visíveis

---

## 🚨 SE AINDA NÃO FUNCIONAR

### Solução de Emergência

1. **Limpe TUDO:**
```javascript
// No console do navegador:
localStorage.clear();
sessionStorage.clear();
```

2. **Feche todas as abas** da aplicação

3. **Abra em aba anônima:**
- Ctrl + Shift + N (Chrome)
- Acesse a aplicação
- Faça login com Google
- Veja se funciona

4. **Se funcionar na anônima:**
- Problema é cache
- Limpe cache do navegador
- Ctrl + Shift + Delete

5. **Se não funcionar nem na anônima:**
- Verifique se fez deploy do código
- Verifique MongoDB (campo existe?)
- Veja logs do console em busca de erros

---

## 📝 LOGS IMPORTANTES

Procure por estes logs que indicam sucesso:

✅ **Login bem-sucedido:**
```
✅ useAuthSync: Usuário autenticado detectado
💾 useAuthSync: Salvando usuário no localStorage
📡 useAuthSync: Eventos disparados!
```

✅ **Sincronização OK:**
```
🔔 UserContext: Evento userLoggedIn recebido!
✅ UserContext: Usuário detectado no localStorage
```

✅ **Permissão Suprema:**
```
permissaoSuprema: "true"
ExIlimitada: "true"
```

❌ **Problema se ver:**
```
❌ Usuário não encontrado
❌ Erro ao buscar dados
⚠️ permissaoSuprema: undefined
```

---

## 🎯 TESTE AGORA!

**Siga os passos acima e reporte:**
1. O que aparece no console?
2. O header atualiza instantaneamente?
3. Vê os botões no painel de usuários?
4. Consegue promover alguém?

**Com os logs detalhados, poderei identificar qualquer problema!** 🔍

---

*Guia de teste criado em 21 de Outubro de 2025*

