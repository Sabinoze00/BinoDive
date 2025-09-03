# BinoDive - Amazon Competitor & Keyword Analysis Dashboard

Una sofisticata web application per l'analisi della concorrenza e delle parole chiave su Amazon, sviluppata con architettura frontend/backend disaccoppiata.

## 🚀 Panoramica del Progetto

BinoDive è una dashboard interattiva che consolida i dati da tre file CSV in un'interfaccia unificata per l'analisi dei competitor Amazon. L'applicazione è progettata con un'architettura scalabile che supporta future integrazioni AI.

## 🏗️ Architettura

### Stack Tecnologico

**Frontend:**
- Next.js 15 con TypeScript
- shadcn/ui per i componenti UI
- Tailwind CSS per lo styling
- React Context per la gestione dello stato

**Backend:**
- Node.js con Express
- TypeScript
- Multer per l'upload dei file
- PapaParse per il parsing CSV

## 📁 Struttura del Progetto

```
BinoDive/
├── frontend/              # React + Next.js
├── backend/              # Node.js + Express
├── shared/types/         # TypeScript types condivisi
└── README.md
```

## 🔧 Setup e Installazione

### Prerequisiti
- Node.js 18+ 
- npm o yarn

### 1. Clona il repository
```bash
git clone <repository-url>
cd BinoDive
```

### 2. Setup Backend
```bash
cd backend
npm install
npm run build
npm run dev
```
Il backend sarà disponibile su `http://localhost:3001`

### 3. Setup Frontend  
```bash
cd frontend
npm install
npm run dev
```
Il frontend sarà disponibile su `http://localhost:3000`

## 📊 Funzionalità Principali

### Input Dati
L'applicazione richiede 3 file CSV:

1. **Keyword Analysis File** (`keyword_analysis...DATA.csv`)
   - Keyword Phrase, Search Volume, Rilevanza, Is_Brand, Brand_Word
   - Colonne ASIN (B0...) per i ranking

2. **Business Data File** (`Helium_10_Xray...`)
   - ASIN, Brand, Image URL, Seller Country, Ratings, Creation Date, Price, Sales, Revenue, Category

3. **Product Data File** (`KeepaExport...`)
   - ASIN, Marca, Immagine, ASIN di variazione

### Dashboard Unificata

- **Riepilogo Mercato**: SV Totale, N. Brand Unici, Total Keywords
- **Analisi Competitiva**: Metriche per ogni competitor (% Forza, Rating, Sales, etc.)
- **Master Keyword List**: Lista completa delle keyword con ranking per competitor

### Funzionalità Interattive

- ✅ **Drag & Drop** per upload file
- ✅ **Selezione multipla** delle keyword
- ✅ **Eliminazione/Ripristino** keyword con ricalcolo automatico
- ✅ **Filtri dinamici** per visualizzazione
- ✅ **Tabella responsive** con colonne fisse

## 🔌 API Endpoints

### `POST /api/v1/analysis`
Carica e processa i 3 file CSV
- Input: FormData con i 3 file
- Output: `analysisId` e summary

### `GET /api/v1/analysis/{analysisId}`  
Recupera i dati completi dell'analisi
- Output: MarketSummary, CompetitorAnalysis, KeywordList

### `PUT /api/v1/analysis/{analysisId}/keywords`
Aggiorna keyword eliminate/ripristinate
- Input: `{ deletedKeywords: [], restoredKeywords: [] }`
- Ricalcola automaticamente tutte le metriche

## 💡 Algoritmi di Calcolo

### SV Totale Mercato
```typescript
totalMarketSV = activeKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0)
```

### % Forza Competitor
```typescript
strengthPercentage = (top30KeywordsSV / totalMarketSV) * 100
```

### Livelli di Forza
- **Molto Forte**: ≥40%
- **Forte**: ≥25% 
- **Medio**: ≥10%
- **Debole**: <10%

## 🎨 UI/UX Features

- **Layout full-screen** con sidebar fissa
- **Tabella unificata** che combina competitor analysis e keyword list  
- **Colonne sticky** per navigazione orizzontale
- **Feedback visivo** per azioni utente
- **Gestione errori** completa
- **Loading states** e progress indicators

## 🔮 Preparazione per AI

L'architettura API-first è progettata per supportare future integrazioni:

```typescript
// Esempio di futuro endpoint AI
POST /api/v1/analysis/{analysisId}/insights
{
  "query": "Trova opportunità di keyword con bassa concorrenza",
  "analysisType": "gap_analysis"
}
```

## 🚀 Sviluppi Futuri

- [ ] Filtri avanzati e ordinamento
- [ ] Export dati (PDF, Excel)
- [ ] Analisi trend temporali  
- [ ] Integrazione modelli AI per insights automatici
- [ ] Dashboard personalizzabili
- [ ] Notifiche e alerts

## 🤝 Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**BinoDive** - Analizza, Confronta, Domina il mercato Amazon 🦅