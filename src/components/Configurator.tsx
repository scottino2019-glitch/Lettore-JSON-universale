import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Code, 
  Layers, 
  Sliders, 
  Palette, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  RefreshCw, 
  HelpCircle,
  FileJson,
  Info,
  ChevronRight,
  Eye,
  Settings2,
  Tv,
  Sparkles,
  Play
} from 'lucide-react';
import { WidgetConfig, WidgetLayout, WidgetTheme } from '../types';
import { SAMPLE_TEMPLATES } from '../samples';
import WidgetView from './WidgetView';

interface ConfiguratorProps {
  onConfigChange: (config: WidgetConfig) => void;
  currentConfig: WidgetConfig;
  jsonData: any;
  onJsonDataChange: (data: any) => void;
  jsonUrl: string;
  onJsonUrlChange: (url: string) => void;
  isLoading: boolean;
  error: string | null;
  onFetchData: (url: string) => void;
  lastUpdated: Date | null;
}

export default function Configurator({
  onConfigChange,
  currentConfig,
  jsonData,
  onJsonDataChange,
  jsonUrl,
  onJsonUrlChange,
  isLoading,
  error,
  onFetchData,
  lastUpdated
}: ConfiguratorProps) {
  const [activeTab, setActiveTab] = useState<'source' | 'mapping' | 'design' | 'embed'>('source');
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(jsonData, null, 2));
  const [tempUrl, setTempUrl] = useState(jsonUrl);
  const [embedType, setEmbedType] = useState<'url' | 'data'>('url');
  const [embedMethod, setEmbedMethod] = useState<'standalone' | 'iframe'>('standalone');

  // Update local JSON text when data changes externally (e.g. from template)
  useEffect(() => {
    setJsonText(JSON.stringify(jsonData, null, 2));
  }, [jsonData]);

  // Sync temp URL with prop
  useEffect(() => {
    setTempUrl(jsonUrl);
  }, [jsonUrl]);

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const template = SAMPLE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      onJsonDataChange(template.data);
      onJsonUrlChange(''); // Reset URL to show it is local
      setTempUrl('');
      
      // Merge template defaults with standard config
      const newConfig: WidgetConfig = {
        ...currentConfig,
        ...template.defaultConfig,
        url: ''
      };
      onConfigChange(newConfig);
    }
  };

  // Apply custom raw JSON pasted
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onJsonDataChange(parsed);
      onJsonUrlChange(''); // Local data now
      
      // Keep existing key configurations if the keys still exist in the new data!
      const paths = availableKeys(parsed);
      const currentTitleKeyExists = currentConfig.titleKey && paths.includes(currentConfig.titleKey);
      
      if (!currentTitleKeyExists) {
        // Only reset / re-guess keys if our titleKey is missing (i.e. structure changed completely)
        guessKeys(parsed);
      }
    } catch (err: any) {
      alert(`JSON non valido: ${err.message}`);
    }
  };

  const availableKeys = (data?: any) => {
    const dataSource = data !== undefined ? data : jsonData;
    const item = Array.isArray(dataSource) ? dataSource[0] : dataSource;
    if (!item || typeof item !== 'object') return [];
    
    const paths: string[] = [];
    const recurse = (obj: any, currentPath: string = '') => {
      if (!obj) return;
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        paths.push(newPath);
        if (val && typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length < 20 && newPath.split('.').length < 3) {
          recurse(val, newPath);
        }
      });
    };
    recurse(item);
    return paths;
  };

  // Guess best keys for mapping when new JSON loaded
  const guessKeys = (data: any) => {
    const firstItem = Array.isArray(data) ? data[0] : data;
    if (!firstItem || typeof firstItem !== 'object') return;

    // Use availableKeys to find all available paths (including deep paths) for the new data
    const paths = availableKeys(data);
    const updates: Partial<WidgetConfig> = {};

    // Guess Title - prioritize rich content words and names, only fallback to ID as last resort
    const titleCandidates = ['titolo', 'title', 'word', 'name', 'nome', 'termine', 'concetto', 'vocabolario', 'autore', 'author', 'evento', 'event', 'metrica', 'metric'];
    let titleKey = paths.find(k => titleCandidates.includes(k.split('.').pop()!.toLowerCase())) || '';
    if (!titleKey && paths.includes('id')) {
      titleKey = 'id';
    }
    if (!titleKey) {
      titleKey = paths[0] || '';
    }
    updates.titleKey = titleKey;

    // Guess Subtitle
    const subtitleCandidates = ['sottotitolo', 'subtitle', 'pronunciation', 'pronuncia', 'valore', 'value', 'price', 'prezzo', 'ruolo', 'role', 'orario', 'time', 'category', 'categoria'];
    const subtitleKey = paths.find(k => subtitleCandidates.includes(k.split('.').pop()!.toLowerCase()) && k !== titleKey) || '';
    updates.subtitleKey = subtitleKey;

    // Guess Body
    const bodyCandidates = ['descrizione', 'description', 'translation', 'traduzione', 'body', 'content', 'commento', 'text', 'testo', 'esempio', 'example', 'andamento', 'trend', 'aula'];
    const bodyKey = paths.find(k => bodyCandidates.includes(k.split('.').pop()!.toLowerCase()) && k !== titleKey && k !== subtitleKey) || '';
    updates.bodyKey = bodyKey;

    // Guess Image
    const imageCandidates = ['foto', 'image', 'img', 'avatar', 'pic', 'foto_piatto', 'photo', 'copertina', 'cover', 'thumbnail'];
    const imageKey = paths.find(k => imageCandidates.includes(k.split('.').pop()!.toLowerCase())) || '';
    updates.imageKey = imageKey;

    // Guess Badge
    const badgeCandidates = ['categoria', 'category', 'level', 'livello', 'stato', 'status', 'tag', 'punteggio', 'rating'];
    const badgeKey = paths.find(k => badgeCandidates.includes(k.split('.').pop()!.toLowerCase()) && k !== titleKey && k !== subtitleKey && k !== bodyKey) || '';
    updates.badgeKey = badgeKey;

    // Guess Color
    const colorCandidates = ['colore', 'color', 'colore_tag', 'colore_indicatore', 'bg', 'accent'];
    const colorKey = paths.find(k => colorCandidates.includes(k.split('.').pop()!.toLowerCase())) || '';
    updates.colorKey = colorKey;

    // Guess Video Key
    const videoCandidates = ['youtube_id', 'video_id', 'video_url', 'video', 'youtube', 'yt', 'copertina_video', 'link_video', 'url_video'];
    const videoKey = paths.find(k => videoCandidates.includes(k.split('.').pop()!.toLowerCase())) || '';
    updates.videoKey = videoKey;

    updates.extraKeys = []; // Reset extra keys when loading new structure

    onConfigChange({
      ...currentConfig,
      ...updates
    });
  };

  // Auto-guess keys when jsonData changes if the current titleKey is not in the new keys
  useEffect(() => {
    if (!jsonData) return;
    const paths = availableKeys(jsonData);
    if (paths.length > 0 && currentConfig.titleKey && !paths.includes(currentConfig.titleKey)) {
      guessKeys(jsonData);
    }
  }, [jsonData]);

  const handleFetchUrl = () => {
    if (tempUrl.trim()) {
      onFetchData(tempUrl.trim());
    }
  };

  // Generate Standalone Pure HTML/JS code (no Iframe)
  const getStandaloneCode = () => {
    const serializedData = JSON.stringify(jsonData, null, 2);
    const layout = currentConfig.layout;
    const theme = currentConfig.theme;
    const titleKey = currentConfig.titleKey;
    const subtitleKey = currentConfig.subtitleKey || '';
    const bodyKey = currentConfig.bodyKey || '';
    const imageKey = currentConfig.imageKey || '';
    const badgeKey = currentConfig.badgeKey || '';
    const colorKey = currentConfig.colorKey || '';
    const videoKey = currentConfig.videoKey || '';
    const fontSize = currentConfig.fontSize || 'base';
    const borderRadius = currentConfig.borderRadius || 'lg';
    const autoplay = currentConfig.autoplay ? 'true' : 'false';
    const cycleInterval = currentConfig.cycleInterval || 5;
    const refreshInterval = currentConfig.refreshInterval || 0;
    const url = embedType === 'url' ? (jsonUrl || '') : '';

    return `<!-- Widget JSON Universale - Standalone -->
<div id="widget-universal-container" class="w-full"></div>

<!-- Carica Tailwind CSS per lo stile -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
(async function() {
  const CONFIG = {
    layout: "${layout}",
    theme: "${theme}",
    titleKey: "${titleKey}",
    subtitleKey: "${subtitleKey}",
    bodyKey: "${bodyKey}",
    imageKey: "${imageKey}",
    badgeKey: "${badgeKey}",
    colorKey: "${colorKey}",
    videoKey: "${videoKey}",
    fontSize: "${fontSize}",
    borderRadius: "${borderRadius}",
    autoplay: ${autoplay},
    cycleInterval: ${cycleInterval},
    refreshInterval: ${refreshInterval}
  };

  const DATA_URL = ${url ? `"${url}"` : 'null'};
  let data = ${serializedData};

  if (DATA_URL) {
    try {
      const response = await fetch(DATA_URL);
      if (response.ok) {
        data = await response.json();
      }
    } catch(e) {
      console.error("Errore nel recupero dati remoti:", e);
    }
  }

  if (!Array.isArray(data)) {
    data = [data];
  }

  let activeIndex = 0;
  let quizAnswers = {};
  let quizRevealed = {};
  let quizStreak = 0;
  let flashcardFlipped = {};
  let flashcardHint = {};
  let selectedVideoIndex = 0;
  let isPlayingVideo = false;

  const themeStyles = {
    light: {
      bg: 'bg-white border-2 border-[#1A1C1E] text-[#1A1C1E]',
      card: 'bg-white border border-[#1A1C1E]/20',
      badge: 'bg-[#1A1C1E]/5 text-[#1A1C1E]',
      accent: 'text-indigo-600',
      btn: 'bg-[#1A1C1E] text-white hover:bg-slate-800'
    },
    dark: {
      bg: 'bg-slate-900 border-2 border-slate-700 text-white',
      card: 'bg-slate-800 border border-slate-700',
      badge: 'bg-slate-700 text-slate-200',
      accent: 'text-yellow-400',
      btn: 'bg-yellow-400 text-slate-900 hover:bg-yellow-300'
    },
    glass: {
      bg: 'bg-gradient-to-r from-blue-900 to-indigo-900 border-2 border-indigo-700 text-white',
      card: 'bg-white/10 backdrop-blur-md border border-white/20',
      badge: 'bg-white/15 text-white',
      accent: 'text-cyan-300',
      btn: 'bg-cyan-400 text-blue-950 hover:bg-cyan-300'
    },
    corporate: {
      bg: 'bg-blue-50 border-2 border-blue-900 text-slate-950',
      card: 'bg-white border border-blue-100',
      badge: 'bg-blue-100 text-blue-800',
      accent: 'text-blue-700',
      btn: 'bg-blue-900 text-white hover:bg-blue-800'
    },
    retro: {
      bg: 'bg-amber-50 border-2 border-amber-900 text-amber-950 font-mono',
      card: 'bg-amber-100/50 border border-amber-900/30',
      badge: 'bg-amber-200/50 text-amber-900',
      accent: 'text-amber-700',
      btn: 'bg-amber-900 text-amber-50 hover:bg-amber-800'
    },
    playful: {
      bg: 'bg-pink-50 border-2 border-pink-500 text-purple-950',
      card: 'bg-white border-2 border-pink-200',
      badge: 'bg-pink-100 text-pink-700',
      accent: 'text-pink-600',
      btn: 'bg-pink-500 text-white hover:bg-pink-600'
    },
    highdensity: {
      bg: 'bg-[#F1F3F5] border-2 border-[#1A1C1E] text-[#1A1C1E]',
      card: 'bg-white border-2 border-[#1A1C1E] shadow-[2px_2px_0px_0px_rgba(26,28,30,1)]',
      badge: 'bg-[#FEF08A] border border-[#1A1C1E] text-[#1A1C1E]',
      accent: 'text-rose-600',
      btn: 'bg-[#1A1C1E] text-white hover:bg-slate-800'
    }
  };

  const getVal = (item, key) => {
    if (!item || !key) return '';
    const parts = key.split('.');
    let current = item;
    for (const part of parts) {
      if (current === null || current === undefined) return '';
      current = current[part];
    }
    return current !== undefined && current !== null ? current : '';
  };

  // Exposed Actions
  window.widgetPrev = () => {
    activeIndex = (activeIndex - 1 + data.length) % data.length;
    render();
  };
  window.widgetNext = () => {
    activeIndex = (activeIndex + 1) % data.length;
    render();
  };
  window.widgetQuizSelect = (opt) => {
    const item = data[activeIndex];
    const correctKey = Object.keys(item).find(k => 
      k.toLowerCase().includes('corretta') || 
      k.toLowerCase().includes('correct') || 
      k.toLowerCase().includes('giusta') || 
      k.toLowerCase() === 'risposta'
    );
    let options = [];
    if (item.opzioni && Array.isArray(item.opzioni)) options = item.opzioni;
    else if (item.options && Array.isArray(item.options)) options = item.options;
    else {
      const optKeys = Object.keys(item).filter(k => k.toLowerCase().includes('opzione') || k.toLowerCase().includes('option'));
      if (optKeys.length > 0) options = optKeys.map(k => item[k]);
      else options = ["Opzione A", "Opzione B", "Opzione C", "Opzione D"];
    }
    const correctAnswer = correctKey ? String(item[correctKey]) : options[0];

    quizAnswers[activeIndex] = opt;
    quizRevealed[activeIndex] = true;
    if (opt === correctAnswer) {
      quizStreak++;
    } else {
      quizStreak = 0;
    }
    render();
  };
  window.widgetVideoSelect = (idx) => {
    selectedVideoIndex = idx;
    isPlayingVideo = false;
    render();
  };
  window.widgetPlayVideo = () => {
    isPlayingVideo = true;
    render();
  };
  window.widgetFlashcardFlip = () => {
    flashcardFlipped[activeIndex] = !flashcardFlipped[activeIndex];
    render();
  };
  window.widgetFlashcardToggleHint = (event) => {
    event.stopPropagation();
    flashcardHint[activeIndex] = !flashcardHint[activeIndex];
    render();
  };

  function render() {
    const container = document.getElementById('widget-universal-container');
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = '<div class="p-6 text-center text-xs opacity-60">Nessun dato caricato.</div>';
      return;
    }

    const theme = themeStyles[CONFIG.theme] || themeStyles.light;
    const radiusMap = { none: 'rounded-none', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-2xl' };
    const radiusClass = radiusMap[CONFIG.borderRadius] || 'rounded-lg';
    
    const fontSizeMap = { sm: 'text-xs', base: 'text-sm', lg: 'text-base' };
    const fontSizeClass = fontSizeMap[CONFIG.fontSize] || 'text-sm';

    let html = '';

    if (CONFIG.layout === 'carousel') {
      const item = data[activeIndex];
      const title = getVal(item, CONFIG.titleKey);
      const subtitle = getVal(item, CONFIG.subtitleKey);
      const body = getVal(item, CONFIG.bodyKey);
      const img = CONFIG.imageKey ? getVal(item, CONFIG.imageKey) : '';
      const badge = CONFIG.badgeKey ? getVal(item, CONFIG.badgeKey) : '';
      const color = CONFIG.colorKey ? getVal(item, CONFIG.colorKey) : '';

      html = \`
        <div class="\${theme.bg} \${radiusClass} overflow-hidden shadow-sm transition-all flex flex-col justify-between h-[320px] relative">
          \${color ? \`<div class="absolute top-0 left-0 right-0 h-1.5" style="background-color: \${color}"></div>\` : ''}
          <div class="p-6 flex gap-4 items-start flex-1 min-w-0">
            \${img ? \`<img src="\${img}" class="w-20 h-20 object-cover \${radiusClass} border border-slate-200/60 shadow-sm flex-shrink-0" referrerpolicy="no-referrer" />\` : ''}
            <div class="flex-1 min-w-0 space-y-1.5 text-left">
              <div class="flex items-center gap-2 flex-wrap">
                \${badge ? \`<span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider \${theme.badge}">\${badge}</span>\` : ''}
                \${subtitle ? \`<span class="text-xs font-semibold opacity-70 truncate max-w-[150px]">\${subtitle}</span>\` : ''}
              </div>
              <h3 class="font-display font-black leading-snug \${fontSizeClass === 'text-xs' ? 'text-sm' : fontSizeClass === 'text-base' ? 'text-lg' : 'text-base'}">\${title}</h3>
              <p class="text-xs opacity-80 leading-relaxed line-clamp-3">\${body}</p>
            </div>
          </div>
          <div class="p-4 flex items-center justify-between border-t border-current/10">
            <button onclick="window.widgetPrev()" class="p-1.5 rounded-lg border-2 border-current bg-transparent hover:bg-black/5 flex items-center justify-center cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span class="text-xs font-mono font-bold">\${activeIndex + 1} / \${data.length}</span>
            <button onclick="window.widgetNext()" class="p-1.5 rounded-lg border-2 border-current bg-transparent hover:bg-black/5 flex items-center justify-center cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      \`;
    } else if (CONFIG.layout === 'grid') {
      let gridHtml = '';
      data.slice(0, 4).forEach((item, idx) => {
        const title = getVal(item, CONFIG.titleKey);
        const subtitle = getVal(item, CONFIG.subtitleKey);
        const body = getVal(item, CONFIG.bodyKey);
        const img = CONFIG.imageKey ? getVal(item, CONFIG.imageKey) : '';
        const badge = CONFIG.badgeKey ? getVal(item, CONFIG.badgeKey) : '';
        const color = CONFIG.colorKey ? getVal(item, CONFIG.colorKey) : '';

        gridHtml += \`
          <div class="p-4 \${theme.card} \${radiusClass} relative overflow-hidden flex flex-col justify-between h-40">
            \${color ? \`<div class="absolute top-0 left-0 right-0 h-1" style="background-color: \${color}"></div>\` : ''}
            <div class="flex gap-3 items-start flex-1 min-w-0">
              \${img ? \`<img src="\${img}" class="w-12 h-12 object-cover \${radiusClass} border border-slate-200/50 flex-shrink-0" referrerpolicy="no-referrer" />\` : ''}
              <div class="flex-1 min-w-0 text-left">
                <div class="flex items-center gap-1.5 flex-wrap">
                  \${badge ? \`<span class="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase \${theme.badge}">\${badge}</span>\` : ''}
                  \${subtitle ? \`<span class="text-[10px] opacity-75 font-mono truncate max-w-[100px]">\${subtitle}</span>\` : ''}
                </div>
                <h4 class="font-bold text-xs mt-1 truncate leading-tight">\${title}</h4>
                <p class="text-[10px] opacity-80 leading-relaxed line-clamp-2 mt-1">\${body}</p>
              </div>
            </div>
          </div>
        \`;
      });
      html = \`<div class="\${theme.bg} \${radiusClass} p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">\${gridHtml}</div>\`;
    } else if (CONFIG.layout === 'list') {
      let listHtml = '';
      data.forEach((item, idx) => {
        const title = getVal(item, CONFIG.titleKey);
        const subtitle = getVal(item, CONFIG.subtitleKey);
        const body = getVal(item, CONFIG.bodyKey);
        const img = CONFIG.imageKey ? getVal(item, CONFIG.imageKey) : '';
        const badge = CONFIG.badgeKey ? getVal(item, CONFIG.badgeKey) : '';
        const color = CONFIG.colorKey ? getVal(item, CONFIG.colorKey) : '';

        listHtml += \`
          <div class="p-3.5 \${theme.card} \${radiusClass} relative overflow-hidden flex gap-4 items-center text-left">
            \${color ? \`<div class="absolute top-0 bottom-0 left-0 w-1" style="background-color: \${color}"></div>\` : ''}
            \${img ? \`<img src="\${img}" class="w-12 h-12 object-cover \${radiusClass} border border-slate-200 flex-shrink-0" referrerpolicy="no-referrer" />\` : ''}
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                \${badge ? \`<span class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase \${theme.badge}">\${badge}</span>\` : ''}
                \${subtitle ? \`<span class="text-[10px] opacity-75 font-mono">\${subtitle}</span>\` : ''}
              </div>
              <h4 class="font-bold text-xs mt-0.5 truncate leading-snug">\${title}</h4>
              <p class="text-[10px] opacity-85 line-clamp-1 mt-0.5">\${body}</p>
            </div>
          </div>
        \`;
      });
      html = \`<div class="\${theme.bg} \${radiusClass} p-4 space-y-3 max-h-[350px] overflow-y-auto">\${listHtml}</div>\`;
    } else if (CONFIG.layout === 'table') {
      let rowsHtml = '';
      data.forEach((item, idx) => {
        const title = getVal(item, CONFIG.titleKey);
        const subtitle = getVal(item, CONFIG.subtitleKey);
        const badge = getVal(item, CONFIG.badgeKey);
        const color = CONFIG.colorKey ? getVal(item, CONFIG.colorKey) : '';

        rowsHtml += \`
          <tr class="border-b border-current/10 hover:bg-black/5 transition-colors">
            <td class="py-2.5 pr-2 font-bold flex items-center gap-2">
              \${color ? \`<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: \${color}"></span>\` : ''}
              <span class="truncate">\${title}</span>
            </td>
            \${CONFIG.subtitleKey ? \`<td class="py-2.5 px-2 font-mono text-[10px] opacity-80">\${subtitle}</td>\` : ''}
            \${CONFIG.badgeKey ? \`<td class="py-2.5 pl-2"><span class="px-1.5 py-0.5 rounded text-[8px] font-bold \${theme.badge}">\${badge}</span></td>\` : ''}
          </tr>
        \`;
      });
      html = \`
        <div class="\${theme.bg} \${radiusClass} p-4 overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-current/20 font-bold uppercase text-[10px] opacity-75 font-mono">
                <th class="py-2 pr-2">Contenuto</th>
                \${CONFIG.subtitleKey ? \`<th class="py-2 px-2">Info</th>\` : ''}
                \${CONFIG.badgeKey ? \`<th class="py-2 pl-2">Stato</th>\` : ''}
              </tr>
            </thead>
            <tbody>
              \${rowsHtml}
            </tbody>
          </table>
        </div>
      \`;
    } else if (CONFIG.layout === 'ticker') {
      const tickerContent = data.map(item => {
        const title = getVal(item, CONFIG.titleKey);
        const badge = CONFIG.badgeKey ? getVal(item, CONFIG.badgeKey) : '';
        const color = CONFIG.colorKey ? getVal(item, CONFIG.colorKey) : '';
        return \`
          <span class="inline-flex items-center gap-2 mx-8 text-xs font-bold whitespace-nowrap">
            \${color ? \`<span class="w-2 h-2 rounded-full" style="background-color: \${color}"></span>\` : ''}
            \${badge ? \`<span class="px-1 rounded text-[8px] font-bold uppercase \${theme.badge}">\${badge}</span>\` : ''}
            <span>\${title}</span>
          </span>
        \`;
      }).join('');

      html = \`
        <div class="\${theme.bg} \${radiusClass} h-[50px] flex items-center overflow-hidden relative w-full">
          <div class="flex animate-marquee whitespace-nowrap">
            \${tickerContent} \${tickerContent}
          </div>
          <style>
            @keyframes marquee {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
            }
            .animate-marquee {
              display: inline-flex;
              animation: marquee 25s linear infinite;
            }
          </style>
        </div>
      \`;
    } else if (CONFIG.layout === 'metric') {
      const item = data[activeIndex];
      const title = getVal(item, CONFIG.titleKey);
      const subtitle = getVal(item, CONFIG.subtitleKey);
      const body = getVal(item, CONFIG.bodyKey);
      const badge = getVal(item, CONFIG.badgeKey);
      const color = CONFIG.colorKey ? getVal(item, CONFIG.colorKey) : '';

      html = \`
        <div class="\${theme.bg} \${radiusClass} p-6 h-[320px] flex flex-col justify-between relative overflow-hidden shadow-sm">
          \${color ? \`<div class="absolute top-0 left-0 right-0 h-1.5" style="background-color: \${color}"></div>\` : ''}
          <div class="text-left space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider font-mono opacity-75">\${title}</span>
              \${badge ? \`<span class="px-2 py-0.5 rounded text-[10px] font-bold \${theme.badge}">\${badge}</span>\` : ''}
            </div>
            <div class="space-y-1">
              <div class="text-4xl md:text-5xl font-display font-black tracking-tight" style="\${color ? \`color: \${color}\` : ''}">
                \${subtitle}
              </div>
              <p class="text-xs font-mono font-bold text-slate-500">\${body}</p>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4 pt-2 border-t border-current/10">
            <button onclick="window.widgetPrev()" class="p-1 rounded-lg border-2 border-current bg-transparent hover:bg-black/5 flex items-center justify-center cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span class="text-xs font-mono font-bold">\${activeIndex + 1} / \${data.length}</span>
            <button onclick="window.widgetNext()" class="p-1 rounded-lg border-2 border-current bg-transparent hover:bg-black/5 flex items-center justify-center cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      \`;
    } else if (CONFIG.layout === 'quiz') {
      const item = data[activeIndex];
      const question = getVal(item, CONFIG.titleKey);
      const category = getVal(item, CONFIG.subtitleKey) || "Quiz";
      const explanation = getVal(item, CONFIG.bodyKey);
      const difficulty = getVal(item, CONFIG.badgeKey);
      const color = CONFIG.colorKey ? getVal(item, CONFIG.colorKey) : '#1A1C1E';

      let options = [];
      if (item.opzioni && Array.isArray(item.opzioni)) options = item.opzioni;
      else if (item.options && Array.isArray(item.options)) options = item.options;
      else {
        const optKeys = Object.keys(item).filter(k => k.toLowerCase().includes('opzione') || k.toLowerCase().includes('option'));
        if (optKeys.length > 0) options = optKeys.map(k => item[k]);
        else options = ["Opzione A", "Opzione B", "Opzione C", "Opzione D"];
      }

      const correctKey = Object.keys(item).find(k => 
        k.toLowerCase().includes('corretta') || 
        k.toLowerCase().includes('correct') || 
        k.toLowerCase().includes('giusta') || 
        k.toLowerCase() === 'risposta'
      );
      const correctAnswer = correctKey ? String(item[correctKey]) : options[0];

      const isAnswered = quizRevealed[activeIndex];
      const selectedAnswer = quizAnswers[activeIndex];
      const isCorrect = selectedAnswer === correctAnswer;

      let optionsHtml = '';
      options.forEach((opt, idx) => {
        let optClass = "bg-white text-[#1A1C1E] border-2 border-[#1A1C1E] hover:bg-[#FEF08A]/40";
        let optIcon = '';

        if (isAnswered) {
          if (opt === correctAnswer) {
            optClass = "bg-emerald-500 text-white border-2 border-emerald-700 shadow-sm";
            optIcon = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
          } else if (selectedAnswer === opt) {
            optClass = "bg-rose-500 text-white border-2 border-rose-700 shadow-sm";
            optIcon = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
          } else {
            optClass = "bg-white text-[#1A1C1E]/50 border-2 border-[#1A1C1E]/30 opacity-60";
          }
        }

        optionsHtml += \`
          <button
            onclick="window.widgetQuizSelect('\${opt.replace(/'/g, "\\\\'")}')"
            \${isAnswered ? 'disabled' : ''}
            class="p-3 text-left rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer \${optClass} \${!isAnswered ? "hover:shadow-[2px_2px_0px_0px_rgba(26,28,30,1)] active:translate-y-0.5" : ""}"
          >
            <span class="flex-1 pr-2">\${opt}</span>
            \${optIcon}
          </button>
        \`;
      });

      let explanationHtml = '';
      if (isAnswered && explanation) {
        explanationHtml = \`
          <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 text-xs text-[#1A1C1E] mt-3 space-y-1 text-left">
            <div class="flex items-center gap-1.5 font-bold text-yellow-800">
              <svg class="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              <span>\${isCorrect ? "Corretto!" : "Non proprio..."} Spiegazione:</span>
            </div>
            <p class="font-medium opacity-90 leading-relaxed font-sans">\${explanation}</p>
          </div>
        \`;
      }

      html = \`
        <div class="\${theme.bg} \${radiusClass} p-4 md:p-6 space-y-4 min-h-[350px] flex flex-col justify-between shadow-sm text-slate-800">
          <div class="flex justify-between items-center border-b-2 border-current/10 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full animate-pulse" style="background-color: \${color}"></span>
              <span class="font-mono text-xs uppercase font-bold tracking-tight opacity-75">\${category}</span>
              \${difficulty ? \`<span class="px-1.5 py-0.5 rounded text-[9px] font-bold \${theme.badge}">\${difficulty}</span>\` : ''}
            </div>
            <div class="text-[10px] font-mono opacity-65 font-bold">
              Punteggio: \${Object.keys(quizAnswers).filter(idxStr => quizAnswers[idxStr] === 'correct').length} / \${Object.keys(quizAnswers).length}
            </div>
          </div>

          <div class="my-2 flex-1 flex flex-col justify-center text-left">
            <h3 class="text-sm md:text-base font-display font-black leading-snug">\${question}</h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            \${optionsHtml}
          </div>

          \${explanationHtml}

          <div class="flex items-center justify-between mt-4 pt-2 border-t border-current/10">
            <button onclick="window.widgetPrev()" class="px-3 py-1.5 rounded-lg border-2 border-current text-[11px] font-bold uppercase tracking-tight bg-white hover:bg-slate-50 transition-all flex items-center gap-1 cursor-pointer">
              Indietro
            </button>
            <span class="font-mono text-xs font-bold opacity-60">\${activeIndex + 1} / \${data.length}</span>
            <button onclick="window.widgetNext()" class="px-3 py-1.5 rounded-lg border-2 border-current text-[11px] font-bold uppercase tracking-tight bg-[#FEF08A] hover:bg-yellow-300 transition-all flex items-center gap-1 cursor-pointer">
              Avanti
            </button>
          </div>
        </div>
      \`;
    } else if (CONFIG.layout === 'video') {
      const activeItem = data[selectedVideoIndex] || data[0];
      const title = getVal(activeItem, CONFIG.titleKey);
      const description = getVal(activeItem, CONFIG.bodyKey);
      const thumbnail = getVal(activeItem, CONFIG.imageKey);
      const badge = getVal(activeItem, CONFIG.badgeKey);
      const channel = getVal(activeItem, CONFIG.subtitleKey);

      // Extract YouTube ID using a robust helper
      const getYTId = (val) => {
        if (!val || typeof val !== 'string') return "dQw4w9WgXcQ";
        const str = val.trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
        const match = str.match(/(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/|youtube\\.com\\/shorts\\/)([a-zA-Z0-9_-]{11})/i);
        if (match && match[1]) return match[1];
        const matchFallback = str.match(/(?:v=|\\/)([a-zA-Z0-9_-]{11})(?:&|\\?|$)/);
        if (matchFallback && matchFallback[1]) return matchFallback[1];
        return "dQw4w9WgXcQ";
      };

      const rawVideoVal = CONFIG.videoKey ? getVal(activeItem, CONFIG.videoKey) : '';
      const youtubeId = rawVideoVal 
        ? getYTId(rawVideoVal) 
        : getYTId(activeItem.youtube_id || activeItem.video_id || activeItem.video_url || "dQw4w9WgXcQ");

      let playlistHtml = '';
      data.forEach((vItem, idx) => {
        const isActive = selectedVideoIndex === idx;
        const vTitle = getVal(vItem, CONFIG.titleKey);
        const vChannel = getVal(vItem, CONFIG.subtitleKey);
        const vDuration = getVal(vItem, CONFIG.badgeKey);
        const vThumbnail = getVal(vItem, CONFIG.imageKey);

        playlistHtml += \`
          <div
            onclick="window.widgetVideoSelect(\${idx})"
            class="p-2 rounded-lg border-2 flex gap-3 items-center transition-all cursor-pointer \${isActive ? "bg-[#FEF08A]/30 border-[#1A1C1E] shadow-[2px_2px_0px_0px_rgba(26,28,30,1)]" : "bg-white border-transparent hover:border-[#1A1C1E]/50 hover:bg-slate-50 text-[#1A1C1E]"}"
          >
            <div class="w-16 aspect-video bg-slate-900 rounded border border-[#1A1C1E]/10 overflow-hidden flex-shrink-0 relative">
              \${vThumbnail ? \`<img src="\${vThumbnail}" class="w-full h-full object-cover" />\` : '<div class="w-full h-full flex items-center justify-center text-slate-500">▶</div>'}
              \${vDuration ? \`<span class="absolute bottom-0.5 right-0.5 bg-black/80 text-white px-0.5 py-0.2 text-[8px] font-mono rounded">\${vDuration}</span>\` : ''}
            </div>
            <div class="flex-1 min-w-0 text-left">
              <h5 class="text-xs font-bold truncate leading-tight">\${vTitle}</h5>
              \${vChannel ? \`<p class="text-[10px] font-mono text-slate-500 truncate leading-tight mt-0.5">\${vChannel}</p>\` : ''}
            </div>
          </div>
        \`;
      });

      html = \`
        <div class="\${theme.bg} \${radiusClass} p-4 md:p-6 space-y-4 shadow-sm text-slate-800">
          <div class="relative aspect-video w-full bg-black rounded-lg overflow-hidden border-2 border-[#1A1C1E] shadow-[4px_4px_0px_0px_rgba(26,28,30,1)]">
            \${isPlayingVideo ? \`
              <iframe src="https://www.youtube.com/embed/\${youtubeId}?autoplay=1" title="\${title}" class="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            \` : \`
              <div class="absolute inset-0 w-full h-full flex flex-col justify-end">
                \${thumbnail ? \`<img src="\${thumbnail}" class="absolute inset-0 w-full h-full object-cover opacity-80" />\` : '<div class="absolute inset-0 bg-slate-900"></div>'}
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <button onclick="window.widgetPlayVideo()" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FEF08A] text-[#1A1C1E] p-4 rounded-full border-2 border-[#1A1C1E] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 hover:scale-110">
                  <svg class="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <div class="relative p-4 text-white z-10 space-y-1 text-left pointer-events-none">
                  <div class="flex items-center gap-2">
                    \${badge ? \`<span class="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight">\${badge}</span>\` : ''}
                    \${channel ? \`<span class="text-[10px] font-mono text-slate-300 uppercase font-bold">\${channel}</span>\` : ''}
                  </div>
                  <h3 class="text-sm md:text-base font-bold text-white tracking-tight line-clamp-1">\${title}</h3>
                </div>
              </div>
            \`}
          </div>

          <div class="space-y-1.5 border-b-2 border-current/10 pb-3 text-left">
            <div class="flex items-center justify-between">
              <h2 class="text-sm md:text-base font-display font-black leading-snug">\${title}</h2>
              \${channel ? \`<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold \${theme.badge}">\${channel}</span>\` : ''}
            </div>
            \${description ? \`<p class="text-xs opacity-70 leading-relaxed font-sans">\${description}</p>\` : ''}
          </div>

          <div class="space-y-2 text-left">
            <h4 class="text-xs font-display font-black uppercase tracking-tight">Playlist (\${data.length} Video)</h4>
            <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              \${playlistHtml}
            </div>
          </div>
        </div>
      \`;
    } else if (CONFIG.layout === 'flashcard') {
      const item = data[activeIndex];
      const front = getVal(item, CONFIG.titleKey);
      const back = getVal(item, CONFIG.bodyKey);
      const hint = getVal(item, CONFIG.subtitleKey);
      const category = getVal(item, CONFIG.badgeKey) || "Flashcard";
      const color = CONFIG.colorKey ? getVal(item, CONFIG.colorKey) : '#10b981';

      const isFlipped = flashcardFlipped[activeIndex] || false;
      const isHintVisible = flashcardHint[activeIndex] || false;

      let cardBody = '';
      if (isFlipped) {
        cardBody = \`<p class="text-xs md:text-sm text-left leading-relaxed text-slate-700 font-medium font-sans">\${back}</p>\`;
      } else {
        cardBody = \`<p class="text-sm md:text-base text-center font-black">\${front}</p>\`;
      }

      let cardFooter = '';
      if (!isFlipped && isHintVisible && hint) {
        cardFooter = \`<p class="text-[10px] font-mono text-center text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200/50 w-full">💡 \${hint}</p>\`;
      } else if (isFlipped) {
        cardFooter = \`<span class="text-[9px] font-mono text-emerald-600 font-bold tracking-tight bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✔ Clicca per rigirare</span>\`;
      }

      html = \`
        <div class="\${theme.bg} \${radiusClass} p-4 md:p-6 space-y-4 min-h-[350px] flex flex-col justify-between shadow-sm text-slate-800">
          <div class="flex justify-between items-center border-b-2 border-current/10 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full animate-pulse" style="background-color: \${color}"></span>
              <span class="font-mono text-xs uppercase font-bold tracking-tight opacity-75">\${category}</span>
            </div>
            <span class="text-[10px] font-mono opacity-60">Clicca sulla carta per girarla</span>
          </div>

          <div class="my-4 flex-1 flex flex-col justify-center items-center">
            <div
              onclick="window.widgetFlashcardFlip()"
              class="w-full max-w-sm aspect-[3/2] min-h-[180px] p-6 rounded-xl border-2 border-[#1A1C1E] flex flex-col justify-between cursor-pointer transition-all duration-300 select-none \${isFlipped ? "bg-[#FEF08A]/10 shadow-[3px_3px_0px_0px_rgba(26,28,30,1)] text-[#1A1C1E]" : "bg-white shadow-[5px_5px_0px_0px_rgba(26,28,30,1)] text-[#1A1C1E]"}"
            >
              <div class="flex justify-between items-center">
                \${!isFlipped && hint ? \`
                  <button onclick="window.widgetFlashcardToggleHint(event)" class="px-2 py-0.5 rounded border border-[#1A1C1E] text-[9px] font-bold font-mono bg-yellow-100 hover:bg-yellow-200 transition-all cursor-pointer text-[#1A1C1E]">
                    \${isHintVisible ? "Nascondi" : "Indizio"}
                  </button>
                \` : ''}
              </div>

              <div class="my-4 text-center">
                \${cardBody}
              </div>

              <div class="min-h-[20px] flex items-center justify-center">
                \${cardFooter}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-current/10">
            <button onclick="window.widgetPrev()" class="px-3 py-1.5 rounded-lg border-2 border-current text-[11px] font-bold uppercase tracking-tight bg-white hover:bg-slate-50 transition-all flex items-center gap-1 cursor-pointer">
              Indietro
            </button>
            <span class="font-mono text-xs font-bold opacity-60">\${activeIndex + 1} / \${data.length}</span>
            <button onclick="window.widgetNext()" class="px-3 py-1.5 rounded-lg border-2 border-current text-[11px] font-bold uppercase tracking-tight bg-[#FEF08A] hover:bg-yellow-300 transition-all flex items-center gap-1 cursor-pointer">
              Avanti
            </button>
          </div>
        </div>
      \`;
    }

    container.innerHTML = html;
  }

  // Autoplay
  if (CONFIG.autoplay && ['carousel', 'ticker', 'metric'].includes(CONFIG.layout)) {
    setInterval(() => {
      activeIndex = (activeIndex + 1) % data.length;
      render();
    }, CONFIG.cycleInterval * 1000);
  }

  // Periodic Refresh Polling
  if (DATA_URL && CONFIG.refreshInterval > 0) {
    setInterval(async () => {
      try {
        const response = await fetch(DATA_URL + '?_t=' + Date.now());
        if (response.ok) {
          data = await response.json();
          if (!Array.isArray(data)) data = [data];
          render();
        }
      } catch(e) {}
    }, CONFIG.refreshInterval * 1000);
  }

  render();
})();
</script>`;
  };

  // Generate Embed Iframe code
  const getEmbedCode = () => {
    const origin = window.location.origin;
    const params = new URLSearchParams();

    // Map basic properties
    params.set('layout', currentConfig.layout);
    params.set('theme', currentConfig.theme);
    params.set('titleKey', currentConfig.titleKey);
    
    if (currentConfig.subtitleKey) params.set('subtitleKey', currentConfig.subtitleKey);
    if (currentConfig.bodyKey) params.set('bodyKey', currentConfig.bodyKey);
    if (currentConfig.imageKey) params.set('imageKey', currentConfig.imageKey);
    if (currentConfig.badgeKey) params.set('badgeKey', currentConfig.badgeKey);
    if (currentConfig.colorKey) params.set('colorKey', currentConfig.colorKey);
    if (currentConfig.videoKey) params.set('videoKey', currentConfig.videoKey);
    if (currentConfig.extraKeys.length > 0) params.set('extraKeys', currentConfig.extraKeys.join(','));
    
    params.set('refresh', String(currentConfig.refreshInterval));
    params.set('cycle', String(currentConfig.cycleInterval));
    params.set('autoplay', currentConfig.autoplay ? '1' : '0');
    params.set('fontSize', currentConfig.fontSize);
    params.set('radius', currentConfig.borderRadius);
    params.set('anim', currentConfig.animation);

    if (embedType === 'url' && jsonUrl) {
      params.set('url', jsonUrl);
    } else {
      // Encode local data inside URL
      try {
        const compressed = btoa(unescape(encodeURIComponent(JSON.stringify(jsonData))));
        params.set('data', compressed);
      } catch (e) {
        // Fallback to URL encoded if btoa fails
        params.set('data', encodeURIComponent(JSON.stringify(jsonData)));
      }
    }

    const embedUrl = `${origin}/?${params.toString()}`;
    const height = currentConfig.layout === 'ticker' ? '60px' : '380px';
    return `<iframe src="${embedUrl}" width="100%" height="${height}" style="border:none; border-radius:8px; overflow:hidden;" allowtransparency="true"></iframe>`;
  };

  const copyToClipboard = () => {
    const textToCopy = embedMethod === 'standalone' ? getStandaloneCode() : getEmbedCode();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const keys = availableKeys();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Sidebar / Left Side */}
      <div className="lg:col-span-5 bg-white border-2 border-[#1A1C1E] rounded-xl shadow-[4px_4px_0px_0px_rgba(26,28,30,1)] overflow-hidden flex flex-col h-full min-h-[550px]">
        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-[#1A1C1E] bg-[#F1F3F5] p-1 gap-1">
          <button
            onClick={() => setActiveTab('source')}
            className={`flex-1 py-2 px-1.5 rounded text-[10px] sm:text-xs font-mono font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer uppercase tracking-tight border border-transparent ${
              activeTab === 'source'
                ? 'bg-[#1A1C1E] text-white border-[#1A1C1E] shadow-sm'
                : 'text-slate-600 hover:text-[#1A1C1E] hover:bg-slate-200/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Sorgente
          </button>
          <button
            onClick={() => setActiveTab('mapping')}
            className={`flex-1 py-2 px-1.5 rounded text-[10px] sm:text-xs font-mono font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer uppercase tracking-tight border border-transparent ${
              activeTab === 'mapping'
                ? 'bg-[#1A1C1E] text-white border-[#1A1C1E] shadow-sm'
                : 'text-slate-600 hover:text-[#1A1C1E] hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Campi
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-2 px-1.5 rounded text-[10px] sm:text-xs font-mono font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer uppercase tracking-tight border border-transparent ${
              activeTab === 'design'
                ? 'bg-[#1A1C1E] text-white border-[#1A1C1E] shadow-sm'
                : 'text-slate-600 hover:text-[#1A1C1E] hover:bg-slate-200/50'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Stile
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`flex-1 py-2 px-1.5 rounded text-[10px] sm:text-xs font-mono font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer uppercase tracking-tight border border-transparent ${
              activeTab === 'embed'
                ? 'bg-[#1A1C1E] text-white border-[#1A1C1E] shadow-sm'
                : 'text-slate-600 hover:text-[#1A1C1E] hover:bg-slate-200/50'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Embed
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          
          {/* TAB 1: SOURCE CONFIGURATION */}
          {activeTab === 'source' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight">Scegli un Modello Esempio per Iniziare</label>
                <p className="text-[11px] text-slate-500 font-sans">Seleziona una struttura pre-configurata per vedere subito il widget in azione:</p>
                <div className="grid grid-cols-1 gap-2.5 mt-2">
                  {SAMPLE_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.id)}
                      className="text-left p-3 rounded-lg border-2 border-[#1A1C1E] bg-white hover:bg-[#FEF08A]/85 hover:shadow-[2px_2px_0px_0px_rgba(26,28,30,1)] transition-all flex items-start gap-3 cursor-pointer group"
                    >
                      <div className="p-1.5 rounded border border-[#1A1C1E] bg-[#F1F3F5] text-[#1A1C1E] group-hover:bg-white transition-colors">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">{t.name}</h4>
                        <p className="text-[10px] text-slate-600 line-clamp-1 mt-0.5 font-sans">{t.description}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 self-center group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-[#1A1C1E] pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-800" />
                    Carica JSON da URL Remoto
                  </label>
                  <span className="text-[9px] bg-[#1A1C1E] text-white font-mono font-bold px-1.5 py-0.5 uppercase tracking-tighter">Dinamico</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Il widget caricherà i dati in tempo reale da un link pubblico (ad es. GitHub Gist raw, mockapi, bucket S3 o il tuo server).
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://mio-sito.it/dati.json"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    className="flex-1 text-xs border-2 border-[#1A1C1E] rounded-lg px-3 py-2 bg-white text-[#1A1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                  <button
                    onClick={handleFetchUrl}
                    disabled={isLoading || !tempUrl}
                    className="bg-[#1A1C1E] hover:bg-slate-800 disabled:bg-slate-200 border-2 border-[#1A1C1E] text-white disabled:text-slate-400 text-xs font-mono font-bold px-4 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(26,28,30,1)]"
                  >
                    {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Carica'}
                  </button>
                </div>
                {error && (
                  <p className="text-[10px] font-mono font-bold text-red-600 bg-red-50 border-2 border-red-200 p-2 rounded-lg">
                    {error}
                  </p>
                )}
                {jsonUrl && !error && (
                  <p className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-500 p-2 rounded-lg flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Collegato con successo! I dati si aggiorneranno in tempo reale.
                  </p>
                )}

                {/* Guida URL RAW */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[10px] text-blue-900 space-y-2 text-left font-sans leading-relaxed">
                  <div className="font-bold flex items-center gap-1 uppercase tracking-tight text-blue-950">
                    <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    Come trovare il link "RAW" corretto:
                  </div>
                  <div className="space-y-1.5">
                    <p><strong>Su GitHub standard:</strong></p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Apri il file <code className="bg-white px-1 py-0.2 rounded font-mono border border-blue-200">.json</code> sul tuo repository.</li>
                      <li>In alto a destra sopra il codice, clicca sul pulsante <strong>"Raw"</strong>.</li>
                      <li>Copia l'URL del browser (inizia con <code className="bg-white px-1 py-0.2 text-[9px] rounded font-mono border border-blue-200">https://raw.githubusercontent.com/...</code>).</li>
                    </ol>
                    
                    <p className="pt-1"><strong>Su GitHub Gist:</strong></p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Apri il tuo Gist con il codice JSON.</li>
                      <li>In alto a destra del riquadro del codice, clicca sul pulsante <strong>"Raw"</strong>.</li>
                      <li>Copia l'URL del browser (inizia con <code className="bg-white px-1 py-0.2 text-[9px] rounded font-mono border border-blue-200">https://gist.githubusercontent.com/...</code>).</li>
                    </ol>

                    <p className="pt-1"><strong>Su Pastebin:</strong></p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Apri la tua Paste.</li>
                      <li>Clicca sul pulsante <strong>"RAW"</strong> nel menu sopra il testo.</li>
                      <li>L'URL corretto diventerà <code className="bg-white px-1 py-0.2 text-[9px] rounded font-mono border border-blue-200">https://pastebin.com/raw/...</code>.</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-[#1A1C1E] pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight flex items-center gap-1.5">
                    <FileJson className="w-3.5 h-3.5 text-slate-800" />
                    Modifica o Incolla JSON Manuale
                  </label>
                  <span className="text-[9px] bg-slate-200 text-[#1A1C1E] font-mono font-bold border border-[#1A1C1E] px-1.5 py-0.5 uppercase tracking-tighter">Manuale</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  Modifica direttamente i dati di seguito per fare dei test rapidi o creare un widget statico embeddabile:
                </p>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="w-full h-44 font-mono text-[11px] bg-slate-900 text-yellow-300 p-3 rounded-lg border-2 border-[#1A1C1E] focus:outline-none focus:ring-2 focus:ring-yellow-300 leading-relaxed"
                  spellCheck={false}
                />
                <button
                  onClick={handleApplyJson}
                  className="w-full bg-[#1A1C1E] hover:bg-slate-800 border-2 border-[#1A1C1E] text-[#FEF08A] text-xs font-mono font-bold py-2 px-4 rounded-lg shadow-[2px_2px_0px_0px_rgba(26,28,30,1)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Applica Cambiamenti JSON
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FIELD MAPPING */}
          {activeTab === 'mapping' && (
            <div className="space-y-4">
              <div className="bg-[#FEF08A]/40 border-2 border-[#1A1C1E] p-3 rounded-lg flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#1A1C1E] flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-[#1A1C1E] font-sans font-medium leading-relaxed">
                  Mappa le chiavi del tuo file JSON ai componenti visivi del widget. Il lettore estrarrà automaticamente i valori corrispondenti per popolare la schermata.
                </p>
              </div>

              {keys.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-mono font-bold uppercase">
                  Nessun file JSON valido caricato. Carica prima dei dati nella scheda Sorgente.
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {/* Title Mapping */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">Titolo Principale *</label>
                      <span className="text-[9px] bg-[#1A1C1E] text-white font-mono px-1 font-bold">Richiesto</span>
                    </div>
                    <select
                      value={currentConfig.titleKey}
                      onChange={(e) => onConfigChange({ ...currentConfig, titleKey: e.target.value })}
                      className="w-full border-2 border-[#1A1C1E] rounded-lg px-3 py-2 text-xs bg-white text-[#1A1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    >
                      <option value="">Seleziona chiave...</option>
                      {keys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  {/* Subtitle Mapping */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">Sottotitolo / Dettaglio secondario</label>
                    <select
                      value={currentConfig.subtitleKey}
                      onChange={(e) => onConfigChange({ ...currentConfig, subtitleKey: e.target.value })}
                      className="w-full border-2 border-[#1A1C1E] rounded-lg px-3 py-2 text-xs bg-white text-[#1A1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    >
                      <option value="">Nessuno</option>
                      {keys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  {/* Body Mapping */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">Descrizione / Testo Esteso</label>
                    <select
                      value={currentConfig.bodyKey}
                      onChange={(e) => onConfigChange({ ...currentConfig, bodyKey: e.target.value })}
                      className="w-full border-2 border-[#1A1C1E] rounded-lg px-3 py-2 text-xs bg-white text-[#1A1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    >
                      <option value="">Nessuno</option>
                      {keys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  {/* Image Mapping */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">Link Immagine (URL)</label>
                    <select
                      value={currentConfig.imageKey}
                      onChange={(e) => onConfigChange({ ...currentConfig, imageKey: e.target.value })}
                      className="w-full border-2 border-[#1A1C1E] rounded-lg px-3 py-2 text-xs bg-white text-[#1A1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    >
                      <option value="">Nessuno</option>
                      {keys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  {/* Video Key Mapping */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">ID o URL Video YouTube (per Galleria Video)</label>
                    <select
                      value={currentConfig.videoKey}
                      onChange={(e) => onConfigChange({ ...currentConfig, videoKey: e.target.value })}
                      className="w-full border-2 border-[#1A1C1E] rounded-lg px-3 py-2 text-xs bg-white text-[#1A1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    >
                      <option value="">Nessuno</option>
                      {keys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  {/* Badge Mapping */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">Badge / Categoria / Stato</label>
                    <select
                      value={currentConfig.badgeKey}
                      onChange={(e) => onConfigChange({ ...currentConfig, badgeKey: e.target.value })}
                      className="w-full border-2 border-[#1A1C1E] rounded-lg px-3 py-2 text-xs bg-white text-[#1A1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    >
                      <option value="">Nessuno</option>
                      {keys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  {/* Color Key Mapping */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">Colore Personalizzato (Hex o CSS color)</label>
                    <select
                      value={currentConfig.colorKey}
                      onChange={(e) => onConfigChange({ ...currentConfig, colorKey: e.target.value })}
                      className="w-full border-2 border-[#1A1C1E] rounded-lg px-3 py-2 text-xs bg-white text-[#1A1C1E] font-mono focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    >
                      <option value="">Nessuno</option>
                      {keys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>

                  {/* Extra Keys Multi-select */}
                  <div className="space-y-1.5 border-t-2 border-[#1A1C1E] pt-3">
                    <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight">Altri campi da mostrare come dettagli</label>
                    <p className="text-[10px] text-slate-500 font-sans">Seleziona quali altri valori visualizzare nel footer delle schede:</p>
                    <div className="grid grid-cols-2 gap-1.5 mt-2 max-h-32 overflow-y-auto p-1.5 border-2 border-[#1A1C1E] rounded-lg bg-white">
                      {keys.map(key => {
                        const extraKeys = currentConfig.extraKeys || [];
                        const isChecked = extraKeys.includes(key);
                        return (
                          <label key={key} className="flex items-center gap-2 text-xs p-1 hover:bg-[#FEF08A]/40 rounded cursor-pointer border border-transparent hover:border-[#1A1C1E] transition-all">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  onConfigChange({ ...currentConfig, extraKeys: [...extraKeys, key] });
                                } else {
                                  onConfigChange({ ...currentConfig, extraKeys: extraKeys.filter(k => k !== key) });
                                }
                              }}
                              className="rounded border-2 border-[#1A1C1E] text-[#1A1C1E] focus:ring-yellow-300"
                            />
                            <span className="truncate font-mono text-[10px] font-bold">{key}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DESIGN OPTIONS */}
          {activeTab === 'design' && (
            <div className="space-y-4">
              {/* Layout Mode */}
              <div className="space-y-2">
                <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight">Layout di Visualizzazione</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'carousel', label: '🎡 Carosello / Slider', desc: 'Cambio periodico automatico' },
                    { id: 'grid', label: '🍱 Bento Grid', desc: 'Griglia moderna reattiva' },
                    { id: 'list', label: '📃 Lista Dettagliata', desc: 'Layout verticale ordinato' },
                    { id: 'table', label: '📅 Tabella Oraria', desc: 'Tabellare strutturata' },
                    { id: 'ticker', label: '⚡ Live Ticker', desc: 'Barra scorrevole sottile' },
                    { id: 'metric', label: '📈 KPI / Metrica', desc: 'Testo gigante evidenziato' },
                    { id: 'quiz', label: '🧠 Quiz Interattivo', desc: 'Domande e risposte live' },
                    { id: 'video', label: '🎬 Galleria Video', desc: 'Video player e playlist' },
                    { id: 'flashcard', label: '📇 Flashcard Studio', desc: 'Clicca per girare la carta' },
                    { id: 'raw', label: '💻 Raw JSON', desc: 'Formato sviluppatore' }
                  ].map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => onConfigChange({ ...currentConfig, layout: layout.id as WidgetLayout })}
                      className={`text-left p-2 rounded-lg border-2 border-[#1A1C1E] text-xs flex flex-col justify-between h-16 transition-all cursor-pointer ${
                        currentConfig.layout === layout.id
                          ? 'bg-[#1A1C1E] text-white shadow-sm'
                          : 'bg-white text-[#1A1C1E] hover:bg-[#FEF08A]/40'
                      }`}
                    >
                      <span className="font-display font-black tracking-tight uppercase text-[10px] sm:text-xs leading-none">{layout.label}</span>
                      <span className="text-[9px] font-mono opacity-80 block line-clamp-1 mt-1 leading-tight">{layout.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema Grafico */}
              <div className="space-y-2 border-t-2 border-[#1A1C1E] pt-3">
                <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight">Tema Grafico</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'light', label: 'Minimal Light', color: 'bg-white border-2 border-[#1A1C1E] text-[#1A1C1E]' },
                    { id: 'dark', label: 'Cosmic Dark', color: 'bg-slate-900 border-2 border-slate-700 text-white' },
                    { id: 'glass', label: 'Sfumato Glass', color: 'bg-gradient-to-r from-blue-900 to-indigo-900 border-2 border-indigo-700 text-white' },
                    { id: 'corporate', label: 'Professional Navy', color: 'bg-blue-50 border-2 border-blue-900 text-slate-950' },
                    { id: 'retro', label: 'Retro Terminal', color: 'bg-amber-50 border-2 border-amber-900 text-amber-950 font-mono' },
                    { id: 'playful', label: 'Cute Pastel', color: 'bg-pink-50 border-2 border-pink-500 text-purple-950' },
                    { id: 'highdensity', label: '⚡ High Density', color: 'bg-[#F1F3F5] border-2 border-[#1A1C1E] text-[#1A1C1E]' }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => onConfigChange({ ...currentConfig, theme: theme.id as WidgetTheme })}
                      className={`p-1.5 rounded text-[10px] text-center font-mono font-bold truncate transition-all cursor-pointer ${theme.color} ${
                        currentConfig.theme === theme.id ? 'ring-2 ring-yellow-300 scale-95 shadow-[2px_2px_0px_0px_rgba(26,28,30,1)]' : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensione Font */}
              <div className="space-y-2 border-t-2 border-[#1A1C1E] pt-3">
                <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight">Dimensione dei Testi</label>
                <div className="grid grid-cols-3 gap-1 bg-[#F1F3F5] border-2 border-[#1A1C1E] p-1 rounded-lg">
                  {[
                    { id: 'sm', label: 'Piccolo' },
                    { id: 'base', label: 'Normale' },
                    { id: 'lg', label: 'Grande' }
                  ].map(sz => (
                    <button
                      key={sz.id}
                      onClick={() => onConfigChange({ ...currentConfig, fontSize: sz.id as 'sm' | 'base' | 'lg' })}
                      className={`py-1 rounded text-[10px] font-mono font-bold text-center cursor-pointer transition-all uppercase tracking-tighter ${
                        currentConfig.fontSize === sz.id 
                          ? 'bg-[#1A1C1E] text-[#FEF08A]' 
                          : 'text-[#1A1C1E] hover:bg-slate-200'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Arrotondamento Angoli */}
              <div className="space-y-2 border-t-2 border-[#1A1C1E] pt-3">
                <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight">Angoli Elementi</label>
                <div className="grid grid-cols-5 gap-1 bg-[#F1F3F5] border-2 border-[#1A1C1E] p-1 rounded-lg">
                  {[
                    { id: 'none', label: 'Nessuno' },
                    { id: 'sm', label: 'SM' },
                    { id: 'md', label: 'MD' },
                    { id: 'lg', label: 'LG' },
                    { id: 'xl', label: 'Arrotondato' }
                  ].map(rd => (
                    <button
                      key={rd.id}
                      onClick={() => onConfigChange({ ...currentConfig, borderRadius: rd.id as any })}
                      className={`py-1 rounded text-[9px] font-mono font-bold text-center cursor-pointer transition-all uppercase tracking-tighter truncate ${
                        currentConfig.borderRadius === rd.id 
                          ? 'bg-[#1A1C1E] text-[#FEF08A]' 
                          : 'text-[#1A1C1E] hover:bg-slate-200'
                      }`}
                    >
                      {rd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animazione Transizione */}
              <div className="space-y-2 border-t-2 border-[#1A1C1E] pt-3">
                <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight">Effetto Transizione Slider</label>
                <div className="grid grid-cols-3 gap-1 bg-[#F1F3F5] border-2 border-[#1A1C1E] p-1 rounded-lg">
                  {[
                    { id: 'fade', label: 'Dissolvenza' },
                    { id: 'slide', label: 'Scivolamento' },
                    { id: 'scale', label: 'Zoom 3D' }
                  ].map(an => (
                    <button
                      key={an.id}
                      onClick={() => onConfigChange({ ...currentConfig, animation: an.id as any })}
                      className={`py-1 rounded text-[10px] font-mono font-bold text-center cursor-pointer transition-all uppercase tracking-tighter ${
                        currentConfig.animation === an.id 
                          ? 'bg-[#1A1C1E] text-[#FEF08A]' 
                          : 'text-[#1A1C1E] hover:bg-slate-200'
                      }`}
                    >
                      {an.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timers & Autoplay (Frequenza) */}
              <div className="space-y-3.5 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    Frequenza Cambio & Aggiornamento
                  </label>
                </div>

                {/* Autoplay Slide Toggle */}
                {['carousel', 'ticker', 'metric'].includes(currentConfig.layout) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Rotazione Automatica Elementi</span>
                      <input
                        type="checkbox"
                        checked={currentConfig.autoplay}
                        onChange={(e) => onConfigChange({ ...currentConfig, autoplay: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500/20"
                      />
                    </div>
                    {currentConfig.autoplay && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 flex-shrink-0">Cambia ogni:</span>
                        <input
                          type="range"
                          min="2"
                          max="30"
                          value={currentConfig.cycleInterval}
                          onChange={(e) => onConfigChange({ ...currentConfig, cycleInterval: Number(e.target.value) })}
                          className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="text-xs font-mono font-bold text-slate-600 w-8 text-right">{currentConfig.cycleInterval}s</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dynamic Web Refresh Polling */}
                {jsonUrl && (
                  <div className="space-y-2 pt-1 border-t border-slate-50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Ricarica File da URL Periodica</span>
                      <select
                        value={currentConfig.refreshInterval}
                        onChange={(e) => onConfigChange({ ...currentConfig, refreshInterval: Number(e.target.value) })}
                        className="border border-slate-200 rounded px-2 py-1 text-[10px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                      >
                        <option value="0">Disabilitata (Solo manuale)</option>
                        <option value="10">Ogni 10 Secondi</option>
                        <option value="30">Ogni 30 Secondi</option>
                        <option value="60">Ogni 1 Minuto</option>
                        <option value="300">Ogni 5 Minuti</option>
                        <option value="600">Ogni 10 Minuti</option>
                      </select>
                    </div>
                    <p className="text-[9px] text-slate-400">
                      Rileva le modifiche manuali che farai sul tuo file JSON ospitato sul server senza costringere i visitatori a ricaricare la pagina!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EMBED CODE GENERATION */}
          {activeTab === 'embed' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 text-emerald-900 border-2 border-emerald-600 p-3.5 rounded-xl flex items-start gap-2.5">
                <Tv className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-tight">Scegli come integrare il tuo Widget!</h4>
                  <p className="text-[10px] leading-relaxed mt-0.5">
                    Offriamo due metodi di integrazione. Il **Metodo Autonomo (Standalone)** inserisce il codice direttamente nella tua pagina evitando i blocchi di sicurezza degli iframe.
                  </p>
                </div>
              </div>

              {/* Toggle Metodo di Integrazione */}
              <div className="space-y-2">
                <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight">Metodo di Integrazione</label>
                <div className="grid grid-cols-2 gap-2 bg-[#F1F3F5] border-2 border-[#1A1C1E] p-1 rounded-lg">
                  <button
                    onClick={() => setEmbedMethod('standalone')}
                    className={`py-2 rounded text-xs font-mono font-bold text-center flex flex-col justify-center items-center gap-0.5 transition-all cursor-pointer ${
                      embedMethod === 'standalone'
                        ? 'bg-[#1A1C1E] text-[#FEF08A]' 
                        : 'text-[#1A1C1E] hover:bg-slate-200'
                    }`}
                  >
                    <span>Codice Standalone (Consigliato)</span>
                    <span className="text-[8px] font-medium opacity-85">Senza Iframe, compatibile 100%</span>
                  </button>
                  <button
                    onClick={() => setEmbedMethod('iframe')}
                    className={`py-2 rounded text-xs font-mono font-bold text-center flex flex-col justify-center items-center gap-0.5 transition-all cursor-pointer ${
                      embedMethod === 'iframe'
                        ? 'bg-[#1A1C1E] text-[#FEF08A]' 
                        : 'text-[#1A1C1E] hover:bg-slate-200'
                    }`}
                  >
                    <span>Iframe Incorporato</span>
                    <span className="text-[8px] font-medium opacity-85">Inclusione classica standard</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-display font-black text-[#1A1C1E] block uppercase tracking-tight">Tipo di Salvataggio Dati</label>
                <div className="grid grid-cols-2 gap-2 bg-[#F1F3F5] border-2 border-[#1A1C1E] p-1 rounded-lg">
                  <button
                    onClick={() => setEmbedType('url')}
                    disabled={!jsonUrl}
                    className={`py-2 rounded text-xs font-mono font-bold text-center flex flex-col justify-center items-center gap-0.5 transition-all cursor-pointer ${
                      embedType === 'url' && jsonUrl
                        ? 'bg-[#1A1C1E] text-[#FEF08A]' 
                        : 'text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    <span>URL JSON Dinamico</span>
                    <span className="text-[8px] font-medium opacity-85">Aggiornamenti in tempo reale</span>
                  </button>
                  <button
                    onClick={() => setEmbedType('data')}
                    className={`py-2 rounded text-xs font-mono font-bold text-center flex flex-col justify-center items-center gap-0.5 transition-all cursor-pointer ${
                      embedType === 'data' || !jsonUrl
                        ? 'bg-[#1A1C1E] text-[#FEF08A]' 
                        : 'text-[#1A1C1E] hover:bg-slate-200'
                    }`}
                  >
                    <span>Salva Dati nel Codice</span>
                    <span className="text-[8px] font-medium opacity-85">Ideale per widget statici</span>
                  </button>
                </div>
                {!jsonUrl && embedType === 'url' && (
                  <p className="text-[9px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                    Nota: Per usare la modalità URL dinamico, devi prima configurare un URL remoto nella scheda "Sorgente".
                  </p>
                )}
              </div>

              {/* Code display field */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-display font-black text-[#1A1C1E] uppercase tracking-tight">
                    {embedMethod === 'standalone' ? "Codice Standalone HTML/JS:" : "Codice Iframe da incorporare:"}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-[11px] font-black text-rose-600 hover:text-rose-800 cursor-pointer uppercase tracking-tight"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Copiato!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copia codice
                      </>
                    )}
                  </button>
                </div>
                
                <textarea
                  readOnly
                  value={embedMethod === 'standalone' ? getStandaloneCode() : getEmbedCode()}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full h-44 font-mono text-[9px] bg-slate-900 text-slate-200 p-3 rounded-xl border-2 border-[#1A1C1E] focus:outline-none focus:ring-1 focus:ring-rose-500 leading-relaxed shadow-inner"
                />
              </div>

              <div className="border-t-2 border-[#1A1C1E] pt-3 space-y-2 text-[10px] text-slate-600 leading-relaxed text-left">
                <p className="font-bold text-[#1A1C1E] flex items-center gap-1 uppercase tracking-tight">
                  <Play className="w-3.5 h-3.5 text-rose-600" />
                  Vantaggi e Informazioni:
                </p>
                {embedMethod === 'standalone' ? (
                  <p>
                    **Perché il codice Standalone?** Perché carica Tailwind CSS e renderizza il widget direttamente nel DOM del tuo sito. Questo garantisce che non ci siano barre di scorrimento indesiderate, che si veda perfettamente sui cellulari e che non venga bloccato dai filtri di sicurezza che bloccano gli iframe! Funziona su WordPress (blocco HTML personalizzato), Shopify, o file .html statici.
                  </p>
                ) : (
                  <p>
                    **Perché l'Iframe?** È il metodo classico se il tuo sistema CMS (come alcuni piani limitati di forum o costruttori di siti web) non permette di inserire script personalizzati nella pagina ma permette solo l'inserimento di iframe.
                  </p>
                )}
                {embedType === 'url' ? (
                  <p>
                    **Aggiornamento dati (Dinamico):** Modifica il file JSON all'URL configurato sul tuo server e il widget mostrerà automaticamente le novità senza che tu debba mai rimettere mano a questo codice!
                  </p>
                ) : (
                  <p>
                    **Aggiornamento dati (Codice):** I dati del widget sono salvati all'interno del codice stesso. Se vuoi modificarli, dovrai tornare qui, cambiare il JSON e ricopiare il codice aggiornato.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Configuration Footer status */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center font-medium">
          <span className="flex items-center gap-1">
            <Settings2 className="w-3 h-3 text-slate-400" />
            Configuratore Pronto
          </span>
          {lastUpdated ? (
            <span>Letto: {lastUpdated.toLocaleTimeString('it-IT')}</span>
          ) : (
            <span>Nessun dato caricato</span>
          )}
        </div>
      </div>

      {/* Real-Time Live Preview / Right Side */}
      <div className="lg:col-span-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Anteprima Widget in Tempo Reale</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Mostrato come nel sito
          </div>
        </div>

        {/* Preview Frame Area */}
        <div className="border border-slate-200 rounded-2xl bg-slate-100/40 p-6 md:p-8 shadow-inner relative group">
          <div className="absolute -top-3 left-4 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-500 shadow-sm">
            Iframe Mockup
          </div>
          
          <WidgetView
            config={currentConfig}
            data={jsonData}
            isLoading={isLoading}
            error={error}
            onManualRefresh={jsonUrl ? () => onFetchData(jsonUrl) : undefined}
            lastUpdated={lastUpdated}
            isIframeMode={false}
          />
        </div>

        {/* Useful hints / tips cards */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl self-start">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800">Consiglio dell'esperto</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Il widget supporta sia array di oggetti che oggetti singoli. Se crei un array, puoi usare i layout <strong>Carosello</strong>, <strong>Ticker</strong> e <strong>Metriche</strong> per ruotare periodicamente gli elementi in sequenza, simulando un feed dinamico e attivo!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
