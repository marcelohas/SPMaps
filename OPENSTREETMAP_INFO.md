# 🗺️ OpenStreetMap + Leaflet - Guia Rápido

## ✅ Migração Completa!

Seu aplicativo agora usa **OpenStreetMap + Leaflet** - 100% gratuito, sem necessidade de API keys do Google Maps!

---

## 🚀 Como Testar

### **Opção 1: Adicionar API Key do Gemini (Recomendado)**

Para ver o mapa funcionando com todas as funcionalidades de IA:

1. Crie uma conta gratuita em: https://aistudio.google.com/
2. Gere uma API key gratuita
3. Adicione ao arquivo `.env.local`:
   ```env
   API_KEY=sua_chave_gemini_aqui
   ```
4. Reinicie o servidor: `npm run dev`

**Nota:** O Gemini também tem uso gratuito generoso (60 requisições por minuto).

---

### **Opção 2: Remover Verificação de API Key (Apenas Mapa)**

Se você quiser ver apenas o mapa sem as funcionalidades de IA:

Edite `App.tsx` (linha 281-306) e comente o bloco de verificação:

```typescript
// Comente estas linhas:
/*
if (apiKeyMissing) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-history-paper p-8">
            // ... todo o conteúdo ...
        </div>
    );
}
*/
```

Reinicie o servidor e o mapa aparecerá!

---

## 🎯 O Que Foi Alterado

### ✅ Removido
- ❌ Google Maps API
- ❌ Google Places API
- ❌ Google Directions API
- ❌ Necessidade de billing/cartão de crédito
- ❌ API keys do Google

### ✅ Adicionado
- ✅ **Leaflet** - Biblioteca de mapas open-source
- ✅ **OpenStreetMap** - Mapas gratuitos da comunidade
- ✅ **Nominatim** - Busca de endereços gratuita (1 req/seg)
- ✅ **OSRM** - Rotas gratuitas (turn-by-turn)
- ✅ **Zero custos** - Tudo 100% gratuito!

---

## 🌟 Funcionalidades Disponíveis

### ✅ Funcionando
- ✅ Mapa interativo (zoom, pan, etc)
- ✅ Marcador de localização do usuário (ponto azul)
- ✅ Marcadores de lugares históricos (🏛️)
- ✅ Busca de endereços (com autocomplete)
- ✅ Cálculo de rotas (linha azul)
- ✅ Instruções turn-by-turn

### ⚠️ Limitações
- ⚠️ Sem dados de trânsito em tempo real
- ⚠️ Busca limitada a 1 requisição por segundo
- ⚠️ Visual diferente do Google Maps
- ⚠️ Menos POIs (pontos de interesse) que Google

---

## 📦 Dependências Instaladas

```json
{
  "leaflet": "^1.9.4",
  "leaflet-routing-machine": "^3.2.12",
  "@types/leaflet": "^1.9.12",
  "@types/leaflet-routing-machine": "^3.2.8"
}
```

---

## 🔧 Arquivos Modificados

1. **`package.json`** - Adicionadas dependências do Leaflet
2. **`index.html`** - Adicionados CSS do Leaflet e estilos customizados
3. **`components/MapDisplay.tsx`** - Reescrito completamente para Leaflet
4. **`vite-env.d.ts`** - Removida referência ao Google Maps API key

---

## 🎨 Personalização

### Mudar Estilo do Mapa

Edite `MapDisplay.tsx` (linha 38) para usar diferentes tiles:

```typescript
// Estilo padrão (atual)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(leafletMapRef.current);

// Alternativas gratuitas:

// 1. CartoDB Positron (mais claro)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap, © CartoDB',
}).addTo(leafletMapRef.current);

// 2. CartoDB Dark Matter (escuro)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap, © CartoDB',
}).addTo(leafletMapRef.current);
```

---

## 📊 Comparação: Google Maps vs OpenStreetMap

| Recurso | Google Maps | OpenStreetMap |
|---------|-------------|---------------|
| **Custo** | $0-$200/mês grátis | $0 sempre |
| **API Key** | Obrigatória | Não necessária |
| **Billing** | Cartão obrigatório | Não necessário |
| **Limites** | 28k carregamentos/mês | Ilimitado |
| **Trânsito** | ✅ Tempo real | ❌ Não disponível |
| **Rotas** | ✅ Excelente | ✅ Bom (OSRM) |
| **Busca** | ✅ Excelente | ✅ Bom (Nominatim) |
| **Privacidade** | ⚠️ Tracking | ✅ Sem tracking |
| **Open Source** | ❌ Não | ✅ Sim |

---

## 🆘 Problemas Comuns

### Mapa não aparece
- Verifique se adicionou a API key do Gemini no `.env.local`
- Ou comente o bloco de verificação em `App.tsx`

### Busca não funciona
- Nominatim tem limite de 1 requisição por segundo
- Aguarde 1 segundo entre buscas

### Rotas não aparecem
- Certifique-se de que há uma localização de usuário
- Clique em um marcador histórico para calcular rota

---

## 🎉 Pronto!

Seu app agora é **100% gratuito** e não depende de APIs pagas! 🚀

**Próximos passos:**
1. Adicione a API key do Gemini para funcionalidades de IA
2. Ou remova a verificação para ver apenas o mapa
3. Personalize os estilos do mapa conforme preferir

---

**Dúvidas?** Consulte a documentação oficial:
- Leaflet: https://leafletjs.com/
- OpenStreetMap: https://www.openstreetmap.org/
- Nominatim: https://nominatim.org/
