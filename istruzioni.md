Piano di Sviluppo: Amazon Competitor & Keyword Dashboard
1. Panoramica del Progetto e Obiettivi
L'obiettivo è creare una web application interattiva, moderna e professionale per l'analisi della concorrenza e delle parole chiave su Amazon. L'applicazione dovrà consolidare i dati da tre file CSV in un'unica dashboard unificata, con un'interfaccia a tutto schermo basata sulla libreria di componenti shadcn/ui.

2. Architettura e Stack Tecnologico
Frontend Framework: React (preferibilmente con Next.js), per supportare nativamente l'integrazione di shadcn/ui.

UI Components: L'applicazione utilizzerà direttamente la libreria di componenti shadcn/ui. Questo implica l'uso di componenti pre-costruiti e personalizzabili come Card, Table, Button, Tooltip, etc., garantendo un'alta qualità estetica e di accessibilità.

Styling: Tailwind CSS (come richiesto da shadcn/ui).

Librerie JS: PapaParse per il parsing dei file CSV.

3. Flusso dei Dati, Input e Logica di Calcolo
L'applicazione si baserà sull'unione di tre fonti di dati. L'ASIN è la chiave primaria. Il parser dovrà leggere solo le colonne fondamentali elencate di seguito, ignorando tutte le altre per ottimizzare le performance.

3.1 File di Input Richiesti (Colonne Fondamentali)
File di Analisi Keyword (Es. keyword_analysis... - DATA.csv)

Scopo: Struttura portante con la lista delle keyword, SV e ranking dei concorrenti.

Colonne da Leggere: Keyword Phrase, Search Volume, Rilevanza, Is_Brand, Brand_Word, e tutte le colonne il cui nome inizia con B0....

File di Vendita e Business (Es. Helium_10_Xray...)

Scopo: Dati di performance e dettagli commerciali.

Colonne da Leggere: ASIN, Brand, Image URL, Seller Country/Region, Ratings, Creation Date, Price €, ASIN Sales, ASIN Revenue, Category.

File di Prodotto (Es. KeepaExport...)

Scopo: Dati di fallback e dettagli sulle variazioni.

Colonne da Leggere: ASIN, Marca, Immagine, ASIN di variazione.

3.2 Tabella di Mappatura e Logica di Calcolo
Valore nella Dashboard

Fonte Dati (File e Colonna)

Logica di Calcolo o Elaborazione

SV TOTALE MERCATO

keyword_analysis... -> Search Volume

Dinamico: Somma dei Search Volume delle keyword visibili.

N. BRAND UNICI

Helium_10_Xray... -> Brand o Keepa... -> Marca

Conteggio dei nomi di brand unici associati agli ASIN analizzati.

Immagine Prodotto

1. Helium_10_Xray... -> Image URL<br>2. Keepa... -> Immagine

Priorità al file Helium 10.

% Forza

keyword_analysis...

Dinamico: Per ogni ASIN, (Somma SV delle KW in Top 30) / (SV TOTALE MERCATO).

Forza (Riepilogo e Individuale)

Calcolato da % Forza

Dinamico: Assegnazione a cluster (Molto Forte, Forte, etc.).

N.Variazioni

KeepaExport... -> ASIN di variazione

Contare gli ASIN separati da virgola (se vuoto, il valore è 1).

Listing Age

Helium_10_Xray... -> Creation Date

Calcolo in mesi dalla Creation Date.

Rilevanza

keyword_analysis...

Lettura diretta, ma impostare a 0 se Is_Brand è true.

Tutti gli altri valori

Come da specifiche precedenti

Lettura diretta e pulizia dei dati.

4. Struttura dell'Interfaccia Utente (UI)
L'applicazione avrà un layout a tutto schermo, diviso in due sezioni principali.

4.1 Sidebar di Navigazione (Sinistra)
Una barra verticale fissa sulla sinistra.

Conterrà i link per navigare tra le diverse sezioni dell'app.

La prima sezione è "Master Keyword List (MKL)". Altre potranno essere aggiunte in futuro.

4.2 Area Principale (Destra)
Occuperà il resto dello schermo.

In Alto: Area per il caricamento dei file.

A Seguire: La dashboard di analisi unificata.

5. Funzionalità Interattive
5.1 Caricamento File (Drag-and-Drop)
Un'area designata permetterà agli utenti di trascinare e rilasciare i tre file CSV richiesti.

L'interfaccia fornirà feedback visivo durante il trascinamento e mostrerà i nomi dei file caricati.

5.2 Filtri Dinamici e Gestione Keyword
Le funzionalità di filtro (per Keyword Phrase, SV Totale, Is_Brand) e di gestione keyword (selezione massiva, eliminazione, ripristino) rimangono come specificato in precedenza, da implementare all'interno dell'architettura React.

Ogni azione di eliminazione/ripristino dovrà innescare un ricalcolo dello stato dell'applicazione e un re-render della UI.

6. Piano di Sviluppo (Fasi)
Fase 1: Setup Progetto React e UI di Base:

Creare un nuovo progetto React (o Next.js).

Installare e configurare shadcn/ui.

Implementare il layout principale a tutto schermo con la Sidebar e l' Area Principale.

Creare il componente per il Drag-and-Drop dei file.

Fase 2: Logica di Calcolo e State Management:

Implementare la logica di parsing che legga solo le colonne necessarie.

Scrivere la funzione processData e gestirla tramite hook di React (es. useMemo) per ottimizzare i ricalcoli.

Gestire i dati caricati e processati nello stato principale dell'applicazione (es. useState).

Fase 3: Rendering della Dashboard:

Sviluppare i componenti React (es. CompetitorTable, KeywordTable) utilizzando i componenti di shadcn/ui per renderizzare la dashboard unificata a partire dai dati nello stato.

Fase 4: Implementazione Funzionalità Interattive:

Sviluppare la logica per i filtri e la gestione delle keyword, manipolando lo stato di React per aggiornare la UI in modo reattivo.

Fase 5: Rifinitura e Test:

Testare l'intera applicazione, ottimizzare le performance e migliorare l'UX.