# Configuração Azure Entra ID - Grupos para Administradores

## Resumo da Implementação

O sistema agora valida acesso usando **grupos do Entra ID**, não mais allowlist de e-mails. Isso permite escalabilidade — qualquer admin pode adicionar/remover usuários sem mexer no código.

---

## ⚙️ Variáveis de Ambiente Necessárias

```env
AZURE_CLIENT_ID=458f58e0-0317-459e-b5c0-4c898a63e55a
AZURE_TENANT_ID=204e3e4b-6b2f-41d3-b97d-549cbaaff526
AZURE_CLIENT_SECRET=kp48Q~kKoh4pw7CPG9SuLep6.K74CSUk8rZia.V
AZURE_REDIRECT_URI=http://localhost:5000/admin/auth
AZURE_ADMIN_GROUP_ID=abe59474-f68f-4eaf-9512-a0565827ea01
SESSION_SECRET=6f9f6f8e-7b6a-4c58-9b6b-4b3d9b7a9f2a
```

---

## 🔑 Explicação das Variáveis

| Variável | O que é | Como obter |
|----------|---------|-----------|
| `AZURE_CLIENT_ID` | ID da aplicação registrada | Azure Portal → App registrations |
| `AZURE_TENANT_ID` | ID do seu tenant Azure | Azure Portal → Overview |
| `AZURE_CLIENT_SECRET` | Senha da aplicação | Azure Portal → Certificates & secrets → Valor do segredo |
| `AZURE_REDIRECT_URI` | URL de retorno após login | A que você registrou na app |
| `AZURE_ADMIN_GROUP_ID` | ID do grupo que controla acesso | Azure Portal → Groups → seu grupo → Object ID |
| `SESSION_SECRET` | Chave para assinar cookies | Qualquer string forte (ex: UUID) |

---

## 🛠️ Passo a Passo - Configuração do Grupo

### 1. Criar um Grupo no Entra ID

1. Vá ao **Azure Portal** → **Azure Active Directory → Groups**
2. Clique em **"New group"**
3. Preencha:
   - **Group type:** Security
   - **Group name:** "Admins Calculadora Previdenciaria" (ou outro nome)
   - **Group description:** (opcional)
4. Clique em **Create**

### 2. Adicionar Usuários ao Grupo

1. Entre no grupo criado
2. Na aba **Members**, clique em **"Add members"**
3. Procure por `vitor.veloso@inminds.com.br`
4. Selecione e clique em **Select**

### 3. Obter o Group ID

1. Dentro do grupo, vá para **Overview**
2. Copie o **Object ID** (esse é seu `AZURE_ADMIN_GROUP_ID`)

---

## 🔐 Permissões da Aplicação

Para que o Azure retorne os grupos do usuário no token, a aplicação precisa de permissão:

1. **Azure Portal → App registrations → sua app**
2. **API permissions** → **Add a permission**
3. Procure por **Microsoft Graph**
4. Clique em **Application permissions**
5. Procure por `Directory.Read.All`
6. Clique em **Add permissions**
7. **Grant admin consent** (está acima das permissões)

---

## ✅ Fluxo de Login com Grupos

```
1. Usuário clica "Entrar com Microsoft"
   ↓
2. Redireciona para Azure Entra ID
   ↓
3. Azure verifica credenciais
   ↓
4. Azure retorna token com claims (incluindo grupos)
   ↓
5. Backend valida:
   - Token é válido?
   - User está no grupo AZURE_ADMIN_GROUP_ID?
   ↓
6. Se sim → Login bem-sucedido
   Se não → Acesso negado (403)
```

---

## 🧪 Testes

### Teste 1: Login bem-sucedido (usuário no grupo)
```bash
# Seu navegador
1. Acesse http://localhost:5000/admin
2. Clique "Entrar com Microsoft"
3. Faça login com vitor.veloso@inminds.com.br
4. Deve ser redirecionado para /admin/dashboard
```

### Teste 2: Verificar logs do servidor
No terminal onde roda `npm run dev`, você deve ver:
```
[AzureAuth] Callback received - Email: vitor.veloso@inminds.com.br, Groups: abe59474-f68f-4eaf-9512-a0565827ea01
[AzureAuth] User authorized via group abe59474-f68f-4eaf-9512-a0565827ea01
```

### Teste 3: Login negado (usuário fora do grupo)
Caso adicione outro usuário que **não está no grupo**:
```bash
1. Tente fazer login com e-mail não autorizado
2. Deve receber: "Acesso negado - Você não tem permissão de administrador"
```

---

## 🚀 Próximos Passos

1. ✅ Criar grupo no Entra ID
2. ✅ Adicionar usuários autorizados ao grupo
3. ✅ Adicionar permissão `Directory.Read.All` à app
4. ✅ Configurar variáveis de ambiente
5. ✅ Reiniciar servidor
6. ✅ Testar login

---

## 📝 Notas de Segurança

- **AZURE_CLIENT_SECRET** nunca deve estar em código — use Secrets Manager (Replit Secrets)
- **SESSION_SECRET** deve ser uma string forte e aleatória
- Revisar regularmente quem está no grupo de admins
- Em produção, sempre use HTTPS para AZURE_REDIRECT_URI

---

**Status:** ✅ Implementado e pronto para testar
**Última atualização:** Feb 10, 2026
