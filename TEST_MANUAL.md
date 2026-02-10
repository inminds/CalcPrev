## Plano de Testes Manuais - Calculadora Previdenciária

**Servidor rodando em:** `http://localhost:5000`
**Status:** ✅ Online

---

## 1. Testes de Cache de CNPJ

### 1.1 - Primeira busca (vai à API externa)
```bash
curl -X GET "http://localhost:5000/api/cnpj/11222333000181" \
  -H "Content-Type: application/json"
```
**Esperado:** 
- Busca em BrasilAPI ou ReceitaWS
- Log: `[CNPJ Cache] MISS - 11222333000181`
- Retorna: `{ razaoSocial, segmento, fpasCode, cnae }`
- Latência: ~500-1000ms

### 1.2 - Segunda busca (vem do cache)
```bash
curl -X GET "http://localhost:5000/api/cnpj/11222333000181" \
  -H "Content-Type: application/json"
```
**Esperado:**
- Cache hit instantâneo
- Log: `[CNPJ Cache] HIT - 11222333000181 (hits: 1, misses: 1)`
- Latência: <5ms

### 1.3 - Ver estatísticas do cache
```bash
# Primeiro fazer login/obter token
TOKEN=$(curl -X POST "http://localhost:5000/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}' | jq -r '.token')

# Depois obter stats
curl -X GET "http://localhost:5000/api/admin/cnpj-cache-stats" \
  -H "Authorization: Bearer $TOKEN"
```
**Esperado:**
```json
{
  "size": 1,
  "maxSize": 1000,
  "hits": 1,
  "misses": 1,
  "hitRate": "50.00%",
  "ttlDays": 7
}
```

---

## 2. Testes de Autenticação

### 2.1 - Login com senha (padrão: admin123)
```bash
curl -X POST "http://localhost:5000/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'
```
**Esperado:**
```json
{
  "success": true,
  "token": "abc123def456..."
}
```

### 2.2 - Verificar autenticação
```bash
TOKEN="<cola o token obtido acima>"

curl -X GET "http://localhost:5000/api/admin/me" \
  -H "Authorization: Bearer $TOKEN"
```
**Esperado:**
```json
{
  "authenticated": true,
  "method": "password"
}
```

### 2.3 - Azure SSO (quando configurado)
```bash
# Inicia fluxo de login
curl -X GET "http://localhost:5000/api/admin/azure/login"
```
**Esperado:** Redireciona para Azure Entra ID

---

## 3. Testes de Cálculo e Simulação

### 3.1 - Executar simulação completa
```bash
curl -X POST "http://localhost:5000/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Empresa Teste LTDA",
    "cnpj": "12345678000190",
    "cnae": "6201500",
    "fpasCode": "515",
    "isDesonerada": false,
    "folhaMensal": "50000.00",
    "sendEmail": false,
    "email": "teste@example.com",
    "webhookUrl": ""
  }'
```
**Esperado:**
- Status: 200 OK
- Retorna: `{ id, simulationData: { ... }, createdAt }`
- Cálculo processado corretamente

### 3.2 - Verificar fila de background jobs
**Obs:** Se `sendEmail` ou `webhookUrl` foram ativados, deve aparecer logs como:
```
[Background Jobs] Job enqueued: send-pdf-email
[Background Jobs] Processing: send-pdf-email
```

---

## 4. Testes de Dashboard Admin

### 4.1 - Buscar parâmetros de cálculo
```bash
TOKEN="<seu token>"

curl -X GET "http://localhost:5000/api/admin/params" \
  -H "Authorization: Bearer $TOKEN"
```
**Esperado:**
```json
{
  "id": 1,
  "salarioMinimo": "1412.00",
  "percentualCredito": "0.20",
  "percentualVerde": "0.15",
  "percentualAmarelo": "0.35",
  "percentualVermelho": "0.50",
  "mesesProjecao": 65
}
```

### 4.2 - Listar leads
```bash
TOKEN="<seu token>"

curl -X GET "http://localhost:5000/api/admin/leads" \
  -H "Authorization: Bearer $TOKEN"
```
**Esperado:** Array de leads com dados do histórico

---

## 5. Testes de Interface (Browser)

### 5.1 - Calculadora pública
1. Acesse: `http://localhost:5000`
2. Preencha o CNPJ: `11222333000181`
3. Observe: Busca automática de dados
4. Verifique console do browser: Deve ver o CNPJ vindo do cache na 2ª busca

### 5.2 - Dashboard Admin
1. Acesse: `http://localhost:5000/admin`
2. Login com: `admin123`
3. Veja a lista de leads
4. Consulte estatísticas do cache
5. Teste botão de logout

### 5.3 - Responsivo
- Teste em mobile (F12 → Device Toolbar)
- Menu lateral deve funcionar
- Formulário deve ser usável

---

## 6. Checklist de Validação

- [ ] Cache de CNPJ funcionando (hit/miss)
- [ ] Autenticação com senha funcionando
- [ ] Simulações sendo processadas
- [ ] Cálculos resultando em valores corretos
- [ ] Dashboard admin acessível
- [ ] Background jobs processando silenciosamente
- [ ] TypeScript compilation sem erros
- [ ] Testes unitários passando
- [ ] Interface responsiva nos testes de browser
- [ ] Logs aparecendo cronologicamente

---

## 7. Problemas Comuns e Soluções

### "CNPJ não encontrado"
- Valide o CNPJ (deve ter exatamente 14 dígitos)
- APIs externas podem estar offline
- Tente um CNPJ cadastrado (ex: 11222333000181 - Google)

### "Unauthorized" em endpoints /api/admin/*
- Token expirou (máx 24h)
- Faça login novamente com `/api/admin/login`

### Melhoramento na tela de login?
- Aguarde até conseguir configurar Azure no .env
- Use a senha padrão `admin123` por enquanto

---

## 8. Variáveis de Ambiente para Testar

Para testar Azure SSO localmente:

```env
AZURE_CLIENT_ID=458f58e0-0317-459e-b5c0-4c898a63e55a
AZURE_TENANT_ID=204e3e4b-6b2f-41d3-b97d-549cbaaff526
AZURE_CLIENT_SECRET=<sua-secret-aqui>
AZURE_REDIRECT_URI=http://localhost:5000/api/admin/azure/callback
AZURE_ADMIN_GROUP_ID=abe59474-f68f-4eaf-9512-a0565827ea01
SESSION_SECRET=seu-secret-session-aleatorio
```

---

**Last Updated:** Feb 10, 2026
**Coverage:** Cache CNPJ, Auth (password + Azure), Background Jobs, Calculations
