import { SampleTemplate } from './types';

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'announcements',
    name: 'Notizie & Annunci (Ticker)',
    description: 'Ideale come barra scorrevole o carosello per avvisi, notizie dell\'ultimo minuto o promozioni speciali.',
    icon: 'Megaphone',
    data: [
      {
        id: 1,
        titolo: "🔥 Sconto del 20% su tutta la collezione estiva!",
        descrizione: "Usa il codice SUMMER20 al checkout. Offerta valida fino alla fine del mese.",
        categoria: "Promozione",
        colore: "#f97316",
        data_pubblicazione: "Oggi"
      },
      {
        id: 2,
        titolo: "⚡️ Nuovo Orario Estivo del Negozio",
        descrizione: "Siamo aperti tutti i giorni dalle 09:00 alle 21:00 con orario continuato.",
        categoria: "Info",
        colore: "#3b82f6",
        data_pubblicazione: "Ieri"
      },
      {
        id: 3,
        titolo: "🚀 Spedizione gratuita per ordini superiori a 50€",
        descrizione: "Consegna garantita in 24/48 ore in tutta Italia con corriere espresso.",
        categoria: "Spedizione",
        colore: "#10b981",
        data_pubblicazione: "3 giorni fa"
      }
    ],
    defaultConfig: {
      layout: 'ticker',
      titleKey: 'titolo',
      subtitleKey: 'categoria',
      bodyKey: 'descrizione',
      badgeKey: 'categoria',
      colorKey: 'colore',
      cycleInterval: 6,
      theme: 'highdensity'
    }
  },
  {
    id: 'quiz_academy',
    name: '🧠 Quiz Interattivi',
    description: 'Carica una lista di domande a risposta multipla per creare quiz ed esercitazioni interattive direttamente nel widget.',
    icon: 'BrainCircuit',
    data: [
      {
        id: 1,
        domanda: "Qual è il pianeta più vicino al Sole?",
        categoria: "Astronomia 🪐",
        opzioni: ["Venere", "Mercurio", "Terra", "Marte"],
        risposta_corretta: "Mercurio",
        spiegazione: "Mercurio è il pianeta più vicino al Sole ed è anche il più piccolo del Sistema Solare.",
        difficolta: "Facile",
        colore: "#f59e0b"
      },
      {
        id: 2,
        domanda: "In quale anno è stato rilasciato il primo iPhone?",
        categoria: "Tecnologia 📱",
        opzioni: ["2005", "2007", "2009", "2010"],
        risposta_corretta: "2007",
        spiegazione: "Steve Jobs presentò il primo iPhone nel 2007, rivoluzionando per sempre il mercato degli smartphone.",
        difficolta: "Medio",
        colore: "#3b82f6"
      },
      {
        id: 3,
        domanda: "Chi ha dipinto la famosa opera 'La Nascita di Venere'?",
        categoria: "Arte & Storia 🎨",
        opzioni: ["Leonardo da Vinci", "Sandro Botticelli", "Raffaello", "Michelangelo"],
        risposta_corretta: "Sandro Botticelli",
        spiegazione: "L'opera è stata dipinta da Sandro Botticelli intorno al 1485 ed è conservata agli Uffizi a Firenze.",
        difficolta: "Difficile",
        colore: "#10b981"
      }
    ],
    defaultConfig: {
      layout: 'quiz',
      titleKey: 'domanda',
      subtitleKey: 'categoria',
      bodyKey: 'spiegazione',
      badgeKey: 'difficolta',
      colorKey: 'colore',
      cycleInterval: 0,
      autoplay: false,
      theme: 'highdensity',
      borderRadius: 'lg'
    }
  },
  {
    id: 'video_tutorials',
    name: '🎬 Galleria Video & Playlist',
    description: 'Ideale per lezioni, corsi, recensioni o video informativi con supporto per video player incorporato.',
    icon: 'Video',
    data: [
      {
        id: 1,
        titolo: "Novità Straordinarie in React 19",
        descrizione: "Una panoramica completa dei nuovi hook, del compilatore automatico di React, delle Server Actions e di come semplificheranno lo sviluppo front-end.",
        durata: "12:35",
        canale: "Tech Lab",
        categoria: "Sviluppo Web",
        youtube_id: "3gM7D5F9mE",
        copertina: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80",
        colore: "#ef4444"
      },
      {
        id: 2,
        titolo: "Come Funziona l'Intelligenza Artificiale Generativa?",
        descrizione: "Scopri cosa sono i Large Language Models (LLM), l'architettura dei Transformer e in che modo le macchine riescono a comprendere e generare linguaggio naturale.",
        durata: "18:20",
        canale: "Scienza Semplice",
        categoria: "AI & Futuro",
        youtube_id: "aircAruvnKk",
        copertina: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80",
        colore: "#6d28d9"
      },
      {
        id: 3,
        titolo: "Basi di Figma per Designer di Interfacce",
        descrizione: "Impara a usare Figma partendo da zero. Scopri l'uso di frame, auto-layout, componenti riutilizzabili e come creare un prototipo cliccabile in pochi passaggi.",
        durata: "15:10",
        canale: "Creative Hub",
        categoria: "UX/UI Design",
        youtube_id: "dQw4w9WgXcQ",
        copertina: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&auto=format&fit=crop&q=80",
        colore: "#10b981"
      }
    ],
    defaultConfig: {
      layout: 'video',
      titleKey: 'titolo',
      subtitleKey: 'canale',
      bodyKey: 'descrizione',
      imageKey: 'copertina',
      badgeKey: 'durata',
      colorKey: 'colore',
      cycleInterval: 0,
      autoplay: false,
      theme: 'highdensity',
      borderRadius: 'lg'
    }
  },
  {
    id: 'learning_flashcards',
    name: '📇 Flashcard Studio',
    description: 'Crea schede di studio interattive e mnemone. Clicca per girare la carta e scoprire la risposta corretta!',
    icon: 'Layers',
    data: [
      {
        id: 1,
        concetto: "Che cos'è una API (Application Programming Interface)?",
        spiegazione: "È un insieme di protocolli e definizioni che permette ad applicazioni software diverse di comunicare e scambiare dati tra loro in modo standardizzato.",
        categoria: "Informatica 💻",
        indizio: "Un intermediario che riceve ed esegue richieste...",
        colore: "#06b6d4"
      },
      {
        id: 2,
        concetto: "Qual è il significato del termine 'Ecosistema'?",
        spiegazione: "Indica l'insieme degli organismi viventi (comunità biologica) e della materia non vivente che interagiscono in un determinato ambiente, influenzandosi a vicenda.",
        categoria: "Ecologia 🌱",
        indizio: "Interazioni tra esseri viventi e ambiente fisico...",
        colore: "#10b981"
      },
      {
        id: 3,
        concetto: "Che cosa si intende per 'Inflazione' in economia?",
        spiegazione: "È il progressivo e continuo aumento generalizzato dei prezzi di beni e servizi in un dato periodo di tempo, che comporta una riduzione del potere d'acquisto della moneta.",
        categoria: "Economia 📈",
        indizio: "La perdita di valore d'acquisto del denaro...",
        colore: "#f43f5e"
      }
    ],
    defaultConfig: {
      layout: 'flashcard',
      titleKey: 'concetto',
      subtitleKey: 'indizio',
      bodyKey: 'spiegazione',
      badgeKey: 'categoria',
      colorKey: 'colore',
      cycleInterval: 0,
      autoplay: false,
      theme: 'highdensity',
      borderRadius: 'xl'
    }
  },
  {
    id: 'events_table',
    name: 'Tabella Orari ed Eventi',
    description: 'Visualizza informazioni dettagliate in formato tabellare strutturato, ordinato e leggibile.',
    icon: 'Calendar',
    data: [
      {
        evento: "Introduzione al Machine Learning",
        relatore: "Dr.ssa Sofia Neri",
        orario: "09:30 - 11:00",
        aula: "Sala Newton (1° Piano)",
        status: "In corso"
      },
      {
        evento: "Coffee Break & Networking",
        relatore: "Staff",
        orario: "11:00 - 11:30",
        aula: "Area Lounge",
        status: "Programmato"
      },
      {
        evento: "Workshop Pratico React & Tailwind",
        relatore: "Ing. Luca Gialli",
        orario: "11:30 - 13:00",
        aula: "Laboratorio Turing",
        status: "Programmato"
      }
    ],
    defaultConfig: {
      layout: 'table',
      titleKey: 'evento',
      subtitleKey: 'orario',
      bodyKey: 'aula',
      badgeKey: 'status',
      theme: 'highdensity',
      borderRadius: 'sm'
    }
  }
];
