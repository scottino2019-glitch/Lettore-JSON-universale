import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileJson, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  ExternalLink,
  Laptop,
  Globe2,
  RefreshCw,
  Code
} from 'lucide-react';
import { WidgetConfig, WidgetLayout, WidgetTheme } from './types';
import { SAMPLE_TEMPLATES } from './samples';
import Configurator from './components/Configurator';
import WidgetView from './components/WidgetView';

const DEFAULT_CONFIG: WidgetConfig = {
  url: '',
  layout: 'carousel',
  refreshInterval: 0,
  cycleInterval: 5,
  theme: 'highdensity',
  titleKey: 'titolo',
  subtitleKey: 'categoria',
  bodyKey: 'descrizione',
  imageKey: '',
  colorKey: 'colore',
  badgeKey: 'categoria',
  extraKeys: [],
  fontSize: 'base',
  borderRadius: 'lg',
  autoplay: true,
  animation: 'fade',
  customStyles: {
    bgColor: '#ffffff',
    textColor: '#1e293b',
    accentColor: '#4f46e5'
  }
};

export default function App() {
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [jsonData, setJsonData] = useState<any>(SAMPLE_TEMPLATES[0].data);
  const [jsonUrl, setJsonUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [isIframeMode, setIsIframeMode] = useState<boolean>(false);

  // Fetch JSON data from URL
  const fetchJsonData = useCallback(async (url: string) => {
    let targetUrl = url.trim();
    if (!targetUrl) return;

    setIsLoading(true);
    setError(null);

    // Auto prepend https if missing protocol
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    // Validate URL format before attempting to fetch
    try {
      new URL(targetUrl);
    } catch (e) {
      setError("URL non valido. Assicurati che sia un indirizzo web completo (es. https://esempio.com/dati.json)");
      setIsLoading(false);
      return;
    }

    try {
      // Handle cache busting so periodic fetches always get fresh data
      const cacheBustUrl = new URL(targetUrl);
      cacheBustUrl.searchParams.set('_t', String(Date.now()));

      const response = await fetch(cacheBustUrl.toString(), {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Risposta del server non valida (${response.status} ${response.statusText})`);
      }
      
      const parsedData = await response.json();
      setJsonData(parsedData);
      setJsonUrl(targetUrl);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.warn("Errore recupero JSON:", err);
      setError(
        `Impossibile caricare il JSON. Verifica che l'URL sia corretto e pubblico. Se riscontri blocchi CORS, assicurati che il server del file consenta l'origine o prova ad usare GitHub Gist (raw link). Dettaglio: ${err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Parse URL Parameters for Iframe Mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasUrl = params.has('url');
    const hasData = params.has('data');

    if (hasUrl || hasData) {
      setIsIframeMode(true);
      
      // Build config from parameters
      const parsedConfig: Partial<WidgetConfig> = {
        layout: (params.get('layout') as WidgetLayout) || 'carousel',
        theme: (params.get('theme') as WidgetTheme) || 'light',
        titleKey: params.get('titleKey') || 'titolo',
        subtitleKey: params.get('subtitleKey') || '',
        bodyKey: params.get('bodyKey') || '',
        imageKey: params.get('imageKey') || '',
        badgeKey: params.get('badgeKey') || '',
        colorKey: params.get('colorKey') || '',
        extraKeys: params.get('extraKeys') ? (params.get('extraKeys') as string).split(',') : [],
        refreshInterval: Number(params.get('refresh') || 0),
        cycleInterval: Number(params.get('cycle') || 5),
        autoplay: params.get('autoplay') !== '0',
        fontSize: (params.get('fontSize') as any) || 'base',
        borderRadius: (params.get('radius') as any) || 'lg',
        animation: (params.get('anim') as any) || 'fade',
      };

      setConfig(prev => ({ ...prev, ...parsedConfig }));

      if (hasUrl) {
        const urlParam = params.get('url') || '';
        setJsonUrl(urlParam);
        fetchJsonData(urlParam);
      } else if (hasData) {
        try {
          const rawData = params.get('data') || '';
          let decodedJson = '';
          try {
            // Try base64 decoding
            decodedJson = decodeURIComponent(escape(atob(rawData)));
          } catch (e) {
            // Fallback to URI decoding
            decodedJson = decodeURIComponent(rawData);
          }
          const parsed = JSON.parse(decodedJson);
          setJsonData(parsed);
          setLastUpdated(new Date());
        } catch (err: any) {
          setError(`Errore di decodifica dei dati incorporati: ${err.message}`);
        }
      }
    } else {
      setIsIframeMode(false);
      // Load announcement sample by default on home
      const defaultTemplate = SAMPLE_TEMPLATES[0];
      setJsonData(defaultTemplate.data);
      setConfig(prev => ({
        ...prev,
        ...defaultTemplate.defaultConfig
      }));
    }
  }, [fetchJsonData]);

  // Handle periodic auto-refresh of JSON URL (Polling)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (jsonUrl && config.refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchJsonData(jsonUrl);
      }, config.refreshInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jsonUrl, config.refreshInterval, fetchJsonData]);

  // Main Page renderer for Iframe (Widget Mode)
  if (isIframeMode) {
    return (
      <div className="w-screen h-screen overflow-hidden p-0 m-0 bg-transparent flex flex-col justify-center">
        <WidgetView
          config={config}
          data={jsonData}
          isLoading={isLoading}
          error={error}
          onManualRefresh={jsonUrl ? () => fetchJsonData(jsonUrl) : undefined}
          lastUpdated={lastUpdated}
          isIframeMode={true}
        />
      </div>
    );
  }

  // Dashboard Renderer (Builder Mode)
  return (
    <div className="min-h-screen bg-[#F1F3F5] text-[#1A1C1E] font-sans selection:bg-yellow-200">
      
      {/* Header Banner */}
      <header className="bg-white border-b-2 border-[#1A1C1E] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 border-2 border-[#1A1C1E] bg-[#FEF08A] flex items-center justify-center text-[#1A1C1E] shadow-[2px_2px_0px_0px_rgba(26,28,30,1)]">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-display font-black tracking-tight text-[#1A1C1E] flex items-center gap-1.5 uppercase">
                Lettore JSON Universale
                <span className="text-[9px] bg-[#1A1C1E] text-[#FEF08A] border border-[#1A1C1E] px-1.5 py-0.5 font-mono font-bold tracking-tighter">No-Code Widget</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">Crea widget dinamici da qualsiasi file JSON</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-mono font-bold text-[#1A1C1E] hover:underline transition-colors hidden sm:flex items-center gap-1 uppercase"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
            <div className="h-4 w-[1px] bg-slate-300 hidden sm:block" />
            <span className="text-[10px] text-slate-500 font-mono uppercase hidden md:block">
              Host: Client-Side (Zero Server)
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Section */}
        <section className="bg-[#FEF08A] border-2 border-[#1A1C1E] rounded-xl p-6 sm:p-8 text-[#1A1C1E] relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,28,30,1)]">
          
          <div className="relative max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1C1E] text-white text-[10px] font-mono font-bold tracking-wider uppercase border border-[#1A1C1E]">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Senza server e senza AI
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight sm:leading-tight uppercase">
              Mostra contenuti dinamici nel tuo sito semplicemente modificando un file JSON!
            </h2>
            
            <p className="text-xs sm:text-sm text-[#1A1C1E]/90 leading-relaxed max-w-2xl font-sans">
              Questo strumento trasforma qualsiasi file o stringa JSON in un widget visivo sbalorditivo (caroselli, bacheche, griglie, tabelle, feed scorrevoli) che puoi integrare nel tuo sito web tramite un comodo <strong>Iframe</strong>. 
              Aggiorna il file JSON sul tuo server ed i contenuti nel sito si aggiorneranno automaticamente in tempo reale!
            </p>

            <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2.5 text-[10px] text-[#1A1C1E] font-mono font-bold">
              <span className="flex items-center gap-1.5 bg-white border border-[#1A1C1E] px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(26,28,30,1)]">
                ⚡ Aggiornamenti istantanei (polling)
              </span>
              <span className="flex items-center gap-1.5 bg-white border border-[#1A1C1E] px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(26,28,30,1)]">
                🎡 Caroselli & Ticker automatici
              </span>
              <span className="flex items-center gap-1.5 bg-white border border-[#1A1C1E] px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(26,28,30,1)]">
                💅 Design High Density integrato
              </span>
            </div>
          </div>
        </section>

        {/* Builder Panel */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-[#1A1C1E]" />
            <h3 className="text-base font-display font-black text-[#1A1C1E] tracking-tight uppercase">Pannello di Controllo & Generatore Widget</h3>
          </div>
          
          <Configurator
            onConfigChange={setConfig}
            currentConfig={config}
            jsonData={jsonData}
            onJsonDataChange={setJsonData}
            jsonUrl={jsonUrl}
            onJsonUrlChange={setJsonUrl}
            isLoading={isLoading}
            error={error}
            onFetchData={fetchJsonData}
            lastUpdated={lastUpdated}
          />
        </section>

        {/* Informative Instructions Details */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t-2 border-[#1A1C1E]">
          <div className="bg-white border-2 border-[#1A1C1E] rounded-lg p-5 space-y-2.5 shadow-[3px_3px_0px_0px_rgba(26,28,30,1)]">
            <div className="w-8 h-8 border-2 border-[#1A1C1E] bg-[#FEF08A] text-[#1A1C1E] flex items-center justify-center font-mono font-black text-sm shadow-[1.5px_1.5px_0px_0px_rgba(26,28,30,1)]">1</div>
            <h4 className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">1. Collega il tuo File JSON</h4>
            <p className="text-[11px] text-[#1A1C1E]/80 leading-relaxed font-sans">
              Carica il tuo file JSON online (per esempio su GitHub, sul tuo hosting WordPress, o su un server cloud pubblico). In alternativa puoi incollarlo manualmente per contenuti statici veloci.
            </p>
          </div>
          <div className="bg-white border-2 border-[#1A1C1E] rounded-lg p-5 space-y-2.5 shadow-[3px_3px_0px_0px_rgba(26,28,30,1)]">
            <div className="w-8 h-8 border-2 border-[#1A1C1E] bg-[#FEF08A] text-[#1A1C1E] flex items-center justify-center font-mono font-black text-sm shadow-[1.5px_1.5px_0px_0px_rgba(26,28,30,1)]">2</div>
            <h4 className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">2. Personalizza il Layout</h4>
            <p className="text-[11px] text-[#1A1C1E]/80 leading-relaxed font-sans">
              Indica al configuratore quali campi mostrare (titolo, immagine, badge, ecc.). Cambia tema, dimensione dei testi o transizioni e abilita lo scorrimento automatico degli elementi con la frequenza che preferisci.
            </p>
          </div>
          <div className="bg-white border-2 border-[#1A1C1E] rounded-lg p-5 space-y-2.5 shadow-[3px_3px_0px_0px_rgba(26,28,30,1)]">
            <div className="w-8 h-8 border-2 border-[#1A1C1E] bg-[#FEF08A] text-[#1A1C1E] flex items-center justify-center font-mono font-black text-sm shadow-[1.5px_1.5px_0px_0px_rgba(26,28,30,1)]">3</div>
            <h4 className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">3. Copia l'Iframe nel tuo Sito</h4>
            <p className="text-[11px] text-[#1A1C1E]/80 leading-relaxed font-sans">
              Copia il codice Iframe generato nella scheda "Embed" e incollalo sulla tua piattaforma. Da quel momento, ogni volta che cambierai il file JSON sul tuo server, il sito mostrerà all'istante i nuovi contenuti dinamici!
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-[#1A1C1E] mt-16 py-8 text-center text-xs text-[#1A1C1E] font-mono font-bold uppercase">
        <p>© 2026 Lettore JSON Universale • Sviluppato per Widget Iframe Dinamici Client-Side</p>
        <p className="mt-1 text-[10px] opacity-75">Nessun database, nessun server, nessun costo di manutenzione.</p>
      </footer>

    </div>
  );
}
