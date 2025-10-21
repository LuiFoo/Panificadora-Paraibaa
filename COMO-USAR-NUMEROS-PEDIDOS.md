# 📦 Sistema de Numeração Sequencial de Pedidos

## 🎯 Como Funciona

O sistema agora gera **números sequenciais** para cada pedido no formato: `00001`, `00002`, `00003`, etc.

### ✨ Vantagens

- ✅ Números curtos e fáceis de lembrar
- ✅ Mais profissional para a padaria
- ✅ Fácil comunicação com clientes ("Seu pedido é o número 125")
- ✅ Sequencial e sem pular números
- ✅ Começa do 00001 automaticamente

---

## 🚀 Inicialização Automática

O sistema **cria o contador automaticamente** no primeiro pedido. Não precisa fazer nada!

Quando o primeiro cliente fizer um pedido, o sistema:
1. Verifica se existe contador
2. Se não existir, cria começando do 00000
3. Incrementa para 00001
4. Salva o pedido com o número 00001

---

## 🔧 Verificar o Contador Atual

Para ver qual será o próximo número de pedido:

```bash
# Execute este script
npx tsx src/scripts/inicializar-contador-pedidos.ts
```

O script mostra:
- ✅ Último número usado
- ✅ Próximo número que será gerado
- ✅ Total de pedidos no banco

---

## 🔄 Resetar o Contador (Use com CUIDADO!)

⚠️ **ATENÇÃO:** Resetar o contador pode causar números duplicados!

**Quando resetar:**
- Ao começar um novo ano
- Ao migrar de sistema
- Para testes em ambiente de desenvolvimento

**Como resetar:**

1. Edite o arquivo: `src/scripts/inicializar-contador-pedidos.ts`

2. Localize esta seção:
```typescript
// ⚠️ DESCOMENTE ABAIXO PARA RESETAR (USE COM EXTREMO CUIDADO!)
// const RESETAR = false; // Mude para true para resetar
```

3. Mude para:
```typescript
const RESETAR = true; // RESETAR ATIVADO
```

4. Execute o script:
```bash
npx tsx src/scripts/inicializar-contador-pedidos.ts
```

5. **IMPORTANTE:** Após resetar, mude de volta para `false`!

---

## 📊 Onde o Número Aparece

### Para o Cliente:
- ✅ Tela de confirmação de pedido
- ✅ Página "Meus Pedidos"
- ✅ Link do WhatsApp para falar com a padaria

### Para a Padaria (Admin):
- ✅ Painel de Pedidos (lista)
- ✅ Detalhes do pedido (modal)
- ✅ Cards de pedidos urgentes

---

## 🎨 Exemplos de Uso

### Cliente recebe:
```
✅ Pedido #00125 realizado com sucesso!
Aguarde a confirmação.
```

### Padaria vê:
```
📦 Pedido #00125
👤 Cliente: João Silva
📞 Telefone: (16) 99999-9999
💰 Total: R$ 45,00
```

### WhatsApp automático:
```
Olá! Gostaria de saber sobre o pedido #00125
```

---

## 🔒 Segurança

O sistema usa **operação atômica** do MongoDB (`findOneAndUpdate` com `$inc`) para:
- ✅ Garantir que números não sejam duplicados
- ✅ Funcionar mesmo com múltiplos pedidos simultâneos
- ✅ Não pular números (exceto em caso de erro no pedido)

---

## 💡 Dicas

### Para Produção
- Deixe o contador funcionar naturalmente
- Não resete sem necessidade
- Números pulados são raros e aceitáveis

### Para Desenvolvimento
- Pode resetar à vontade para testes
- Use um banco de dados separado para dev
- Números começam do 00001 em cada ambiente

---

## 📞 Suporte

Se tiver problemas com numeração:

1. Execute o script de verificação
2. Verifique se a coleção "contadores" existe
3. Verifique se há pedidos sem numeroPedido
4. Entre em contato com o desenvolvedor

---

## 🎯 Formato Técnico

- **Formato:** String de 5 dígitos
- **Padrão:** "00001" até "99999"
- **Armazenamento:** Campo `numeroPedido` na coleção `pedidos`
- **Contador:** Coleção `contadores`, documento `{ _id: "pedidos", ultimoNumero: N }`

---

**Criado para facilitar o dia a dia da Panificadora Paraíba** 🍞

