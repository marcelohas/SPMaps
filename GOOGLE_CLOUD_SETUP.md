# 🔧 Configuração do Google Cloud para Google Maps API

## ⚠️ Problema Atual

Seu aplicativo está mostrando os seguintes erros:
- `BillingNotEnabledMapError` - Faturamento não habilitado
- `ApiNotActivatedMapError` - APIs não ativadas

**Isso impede completamente o funcionamento do mapa.** Siga os passos abaixo para resolver.

---

## 📋 Passo a Passo

### 1️⃣ Acessar o Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. Selecione o projeto que contém sua API Key (ou crie um novo projeto)

---

### 2️⃣ Habilitar Faturamento (OBRIGATÓRIO)

> **💡 Nota:** Google oferece $300 de crédito gratuito para novos usuários. Você precisará adicionar um cartão, mas não será cobrado até esgotar o crédito.

1. No menu lateral, vá em **"Faturamento"** (Billing)
2. Clique em **"Vincular uma conta de faturamento"** (Link a billing account)
3. Siga as instruções para adicionar um método de pagamento
4. Aguarde a confirmação (pode levar alguns minutos)

**📌 Link direto:** https://console.cloud.google.com/billing

---

### 3️⃣ Ativar as APIs Necessárias

Você precisa ativar **3 APIs diferentes**:

#### A) Maps JavaScript API

1. Acesse: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
2. Clique em **"ATIVAR"** (ENABLE)
3. Aguarde a ativação

#### B) Places API

1. Acesse: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
2. Clique em **"ATIVAR"** (ENABLE)
3. Aguarde a ativação

#### C) Directions API

1. Acesse: https://console.cloud.google.com/apis/library/directions-backend.googleapis.com
2. Clique em **"ATIVAR"** (ENABLE)
3. Aguarde a ativação

**📌 Ou busque manualmente:**
- No Cloud Console, vá em **"APIs e Serviços" > "Biblioteca"**
- Busque por cada API acima e clique em "Ativar"

---

### 4️⃣ Verificar Restrições da API Key

1. Vá em **"APIs e Serviços" > "Credenciais"**
2. Clique na sua API Key
3. Em **"Restrições de aplicativo"**:
   - Para desenvolvimento local: selecione **"Nenhuma"** (temporariamente)
   - Para produção: configure **"Referenciadores HTTP"** e adicione:
     - `http://localhost:*`
     - `https://marcelohas.github.io/*` (seu domínio GitHub Pages)

4. Em **"Restrições de API"**:
   - Selecione **"Restringir chave"**
   - Marque as 3 APIs:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Directions API

5. Clique em **"SALVAR"**

**📌 Link direto:** https://console.cloud.google.com/apis/credentials

---

### 5️⃣ Testar a Configuração

1. Aguarde **2-5 minutos** para as mudanças propagarem
2. Limpe o cache do navegador (Ctrl + Shift + Delete)
3. Execute seu app: `npm run dev`
4. Abra o console do navegador (F12)
5. Verifique se os erros de billing/API desapareceram

---

## ✅ Checklist de Verificação

Antes de testar, confirme que você completou:

- [ ] Faturamento habilitado no projeto
- [ ] Maps JavaScript API ativada
- [ ] Places API ativada
- [ ] Directions API ativada
- [ ] Restrições da API Key configuradas
- [ ] Aguardou 2-5 minutos para propagação
- [ ] Limpou o cache do navegador

---

## 🆘 Problemas Comuns

### Erro persiste após ativar APIs
- **Solução:** Aguarde mais tempo (até 10 minutos) e limpe o cache completamente

### "Quota exceeded"
- **Solução:** Verifique se o faturamento está realmente ativo. Vá em "Faturamento" e confirme que há uma conta vinculada

### API Key não funciona
- **Solução:** Verifique as restrições. Para testes, remova todas as restrições temporariamente

### Cobranças inesperadas
- **Solução:** Configure alertas de faturamento em "Faturamento > Orçamentos e alertas"
- Google Maps oferece $200/mês de uso gratuito (suficiente para desenvolvimento)

---

## 📊 Custos Estimados

Para referência, o uso gratuito mensal do Google Maps inclui:

- **Maps JavaScript API:** $200 de crédito/mês
- **Places API:** Primeiras 1.000 solicitações grátis
- **Directions API:** Primeiras 1.000 solicitações grátis

Para um app em desenvolvimento, você provavelmente **não será cobrado** se usar apenas para testes.

---

## 📚 Documentação Oficial

- [Google Maps Platform - Começar](https://developers.google.com/maps/get-started)
- [Ativar Faturamento](https://developers.google.com/maps/documentation/javascript/cloud-setup)
- [Gerenciar API Keys](https://developers.google.com/maps/documentation/javascript/get-api-key)
- [Preços](https://developers.google.com/maps/billing-and-pricing/pricing)

---

**🎯 Após completar estes passos, seu mapa deve funcionar perfeitamente!**
