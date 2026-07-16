import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  Code, 
  ArrowUpRight, 
  ExternalLink,
  Layers,
  Check,
  X,
  Play,
  HelpCircle,
  Lightbulb,
  Award,
  BookOpen,
  Tv
} from 'lucide-react';
import { WidgetConfig, WidgetLayout, WidgetTheme } from '../types';

interface WidgetViewProps {
  config: WidgetConfig;
  data: any;
  isLoading?: boolean;
  error?: string | null;
  onManualRefresh?: () => void;
  lastUpdated?: Date | null;
  isIframeMode?: boolean;
}

export default function WidgetView({
  config,
  data,
  isLoading = false,
  error = null,
  onManualRefresh,
  lastUpdated,
  isIframeMode = false
}: WidgetViewProps) {
  // Convert non-array to array if necessary, except for raw view
  const items = Array.isArray(data) ? data : data ? [data] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshingEffect, setIsRefreshingEffect] = useState(false);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quiz states
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizRevealed, setQuizRevealed] = useState<Record<number, boolean>>({});
  const [quizStreak, setQuizStreak] = useState(0);

  // Flashcard states
  const [flashcardFlipped, setFlashcardFlipped] = useState<Record<number, boolean>>({});
  const [flashcardHint, setFlashcardHint] = useState<Record<number, boolean>>({});

  // Video states
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Auto-cycle index for carousel/ticker/metric (if it's a slider)
  useEffect(() => {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
    }

    const needsCycling = ['carousel', 'ticker', 'metric'].includes(config.layout) && items.length > 1;
    if (needsCycling && config.autoplay && config.cycleInterval > 0) {
      cycleTimerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % items.length);
      }, config.cycleInterval * 1000);
    }

    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, [items.length, config.layout, config.autoplay, config.cycleInterval]);

  // Reset active index and interactive states if data or layout changes
  useEffect(() => {
    setActiveIndex(0);
    setQuizAnswers({});
    setQuizRevealed({});
    setFlashcardFlipped({});
    setFlashcardHint({});
    setSelectedVideoIndex(0);
    setIsPlayingVideo(false);
  }, [items.length, config.layout]);

  // Visual trigger for refresh button
  const handleRefreshClick = () => {
    if (onManualRefresh) {
      setIsRefreshingEffect(true);
      onManualRefresh();
      setTimeout(() => setIsRefreshingEffect(false), 800);
    }
  };

  // Helper to extract nested key values (e.g. "user.name")
  const getKeyValue = (obj: any, pathString: string): any => {
    if (!obj || !pathString) return undefined;
    const parts = pathString.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  };

  // Format date helper
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Get current styles based on theme
  const getThemeClasses = (): { container: string; card: string; textPrimary: string; textSecondary: string; accent: string; badge: string; border: string } => {
    switch (config.theme) {
      case 'dark':
        return {
          container: 'bg-slate-950 text-slate-100 border-slate-800',
          card: 'bg-slate-900/80 border-slate-800 hover:border-slate-700',
          textPrimary: 'text-slate-100',
          textSecondary: 'text-slate-400',
          accent: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          badge: 'bg-slate-800 text-indigo-300 border-indigo-500/30',
          border: 'border-slate-800'
        };
      case 'glass':
        return {
          container: 'bg-gradient-to-br from-indigo-950/40 to-slate-950/40 backdrop-blur-lg text-white border-white/10',
          card: 'bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300',
          textPrimary: 'text-white',
          textSecondary: 'text-indigo-200/80',
          accent: 'text-sky-300 bg-sky-400/10 border-sky-400/20',
          badge: 'bg-white/10 text-sky-200 border-sky-400/20',
          border: 'border-white/10'
        };
      case 'corporate':
        return {
          container: 'bg-slate-50 text-slate-800 border-slate-200',
          card: 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300',
          textPrimary: 'text-slate-900 font-semibold',
          textSecondary: 'text-slate-500',
          accent: 'text-blue-600 bg-blue-50 border-blue-100',
          badge: 'bg-slate-100 text-blue-700 border-slate-200',
          border: 'border-slate-200'
        };
      case 'retro':
        return {
          container: 'bg-amber-50 text-amber-950 border-amber-900 font-mono',
          card: 'bg-amber-50 border-2 border-amber-950 hover:bg-amber-100/50 shadow-[4px_4px_0px_0px_rgba(120,53,4,1)]',
          textPrimary: 'text-amber-950 font-bold',
          textSecondary: 'text-amber-900/80',
          accent: 'text-amber-900 bg-amber-200/50 border-amber-950',
          badge: 'bg-amber-100 border border-amber-950 text-amber-950 font-bold',
          border: 'border-amber-950'
        };
      case 'playful':
        return {
          container: 'bg-pink-50/30 text-purple-900 border-purple-100',
          card: 'bg-white border-2 border-purple-100 hover:border-pink-300 hover:scale-[1.01] transition-all duration-300 rounded-2xl shadow-sm',
          textPrimary: 'text-purple-950 font-bold',
          textSecondary: 'text-purple-700/80',
          accent: 'text-pink-600 bg-pink-50 border-pink-100',
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
          border: 'border-purple-100'
        };
      case 'highdensity':
        return {
          container: 'bg-[#F8F9FA] text-[#1A1C1E] border-2 border-[#1A1C1E] font-sans',
          card: 'bg-white border-2 border-[#1A1C1E] hover:bg-[#F1F3F5] transition-all shadow-[3px_3px_0px_0px_rgba(26,28,30,1)]',
          textPrimary: 'text-[#1A1C1E] font-bold tracking-tight',
          textSecondary: 'text-slate-500 font-mono text-xs uppercase',
          accent: 'text-[#1A1C1E] bg-yellow-300 border border-[#1A1C1E] font-bold',
          badge: 'bg-[#1A1C1E] text-white px-2 py-0.5 text-[10px] font-mono font-bold tracking-tighter uppercase border border-[#1A1C1E]',
          border: 'border-[#1A1C1E]'
        };
      case 'light':
      default:
        return {
          container: 'bg-white text-slate-800 border-slate-200',
          card: 'bg-slate-50/50 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-300',
          textPrimary: 'text-slate-900',
          textSecondary: 'text-slate-500',
          accent: 'text-slate-800 bg-slate-100 border-slate-200',
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          border: 'border-slate-200'
        };
    }
  };

  const themeClasses = getThemeClasses();

  // Font size multiplier
  const getFontSizeClass = () => {
    switch (config.fontSize) {
      case 'sm': return { title: 'text-base md:text-lg', body: 'text-xs md:text-sm', badge: 'text-[10px]' };
      case 'lg': return { title: 'text-xl md:text-2xl', body: 'text-base md:text-lg', badge: 'text-sm' };
      case 'base':
      default:
        return { title: 'text-lg md:text-xl', body: 'text-sm md:text-base', badge: 'text-xs' };
    }
  };

  const sizes = getFontSizeClass();

  // Border radius class helper
  const getRadiusClass = () => {
    switch (config.borderRadius) {
      case 'none': return 'rounded-none';
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'xl': return 'rounded-2xl';
      default: return 'rounded-md';
    }
  };

  const radiusClass = getRadiusClass();

  // Custom inline style if themed "custom"
  const getContainerStyle = () => {
    return {};
  };

  // If loading and there's no data yet, show nice skeleton/spinner
  if (isLoading && items.length === 0) {
    return (
      <div className={`w-full h-full min-h-[250px] flex flex-col items-center justify-center p-6 border ${radiusClass} ${themeClasses.container}`}>
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mb-2" />
        <p className="text-sm text-slate-400 animate-pulse font-medium">Caricamento dati in corso...</p>
      </div>
    );
  }

  // If there's an error and no items
  if (error && items.length === 0) {
    return (
      <div className={`w-full h-full min-h-[250px] flex flex-col items-center justify-center p-6 border ${radiusClass} ${themeClasses.container} border-red-500/30`}>
        <div className="bg-red-500/10 p-3 rounded-full text-red-500 mb-3 border border-red-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h4 className="text-base font-bold text-red-500 mb-1">Errore di Caricamento</h4>
        <p className="text-xs text-center max-w-md opacity-80 mb-4">{error}</p>
        {onManualRefresh && (
          <button 
            onClick={handleRefreshClick}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Riprova a caricare
          </button>
        )}
      </div>
    );
  }

  // If JSON structure is empty or no valid array items
  if (items.length === 0) {
    return (
      <div className={`w-full h-full min-h-[250px] flex flex-col items-center justify-center p-6 border ${radiusClass} ${themeClasses.container}`}>
        <Layers className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
        <p className="text-sm font-medium opacity-70">Nessun dato disponibile da mostrare</p>
        <p className="text-xs opacity-50 text-center max-w-xs mt-1">
          Fornisci un URL JSON valido o inserisci dei dati nel configuratore.
        </p>
      </div>
    );
  }

  // Search Filtered items for layouts like Grid, List, Table
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    // Search in title, subtitle, and body fields
    const titleVal = String(getKeyValue(item, config.titleKey) || '').toLowerCase();
    const subtitleVal = String(getKeyValue(item, config.subtitleKey) || '').toLowerCase();
    const bodyVal = String(getKeyValue(item, config.bodyKey) || '').toLowerCase();
    const badgeVal = String(getKeyValue(item, config.badgeKey) || '').toLowerCase();

    return titleVal.includes(term) || 
           subtitleVal.includes(term) || 
           bodyVal.includes(term) || 
           badgeVal.includes(term);
  });

  // Animation variants
  const getTransitionVariants = () => {
    if (config.animation === 'slide') {
      return {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 }
      };
    } else if (config.animation === 'scale') {
      return {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 }
      };
    }
    // Default: fade
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    };
  };

  const animVariants = getTransitionVariants();

  // RENDER SECTIONS BASED ON LAYOUTS
  
  // ---------------------------------------------
  // 1. CAROUSEL / SLIDER LAYOUT
  // ---------------------------------------------
  const renderCarousel = () => {
    const item = items[activeIndex];
    if (!item) return null;

    const title = getKeyValue(item, config.titleKey);
    const subtitle = getKeyValue(item, config.subtitleKey);
    const body = getKeyValue(item, config.bodyKey);
    const image = getKeyValue(item, config.imageKey);
    const badge = getKeyValue(item, config.badgeKey);
    const customColor = getKeyValue(item, config.colorKey);

    return (
      <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-8 min-h-[280px]">
        {/* Top/Badge Row */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            {badge && (
              <span className={`inline-block px-2.5 py-0.5 border text-xs font-semibold rounded-full ${themeClasses.badge}`}>
                {String(badge)}
              </span>
            )}
          </div>
          {/* Controls */}
          {items.length > 1 && (
            <div className="flex items-center gap-1.5 z-10">
              <button 
                onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)}
                className={`p-1.5 rounded-full border hover:scale-105 transition-all ${themeClasses.badge}`}
                title="Precedente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono opacity-60">
                {activeIndex + 1} / {items.length}
              </span>
              <button 
                onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
                className={`p-1.5 rounded-full border hover:scale-105 transition-all ${themeClasses.badge}`}
                title="Successivo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content with animation */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 items-center md:items-start justify-center md:justify-start">
          {image && (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/20 shadow-md">
              <img 
                src={String(image)} 
                alt={String(title || 'Widget Image')} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col justify-center text-center md:text-left w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                variants={animVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35 }}
                className="space-y-2.5"
              >
                {title && (
                  <h3 
                    className={`${sizes.title} font-bold leading-tight ${themeClasses.textPrimary}`}
                    style={customColor ? { color: customColor } : {}}
                  >
                    {String(title)}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm md:text-base font-medium opacity-85">
                    {String(subtitle)}
                  </p>
                )}
                {body && (
                  <p className={`${sizes.body} leading-relaxed opacity-75 whitespace-pre-line`}>
                    {String(body)}
                  </p>
                )}

                {/* Extra values */}
                {(config.extraKeys || []).length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-dashed opacity-75 border-slate-500/20 text-xs">
                    {(config.extraKeys || []).map((key, i) => {
                      const val = getKeyValue(item, key);
                      if (val === undefined || val === null) return null;
                      return (
                        <div key={i} className="flex flex-col">
                          <span className="font-semibold capitalize opacity-50">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-mono">{String(val)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Carousel indicators dots */}
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  i === activeIndex 
                    ? 'w-6 bg-indigo-500 opacity-100' 
                    : 'w-1.5 bg-slate-400 opacity-30 hover:opacity-60'
                }`}
                title={`Vai all'elemento ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------
  // 2. GRID LAYOUT
  // ---------------------------------------------
  const renderGrid = () => {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {/* Search header inside iframe */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none opacity-50">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cerca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-1.5 text-xs rounded-md border bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500/40 ${themeClasses.border}`}
            />
          </div>
          {filteredItems.length !== items.length && (
            <span className="text-xs opacity-60 font-mono">
              Trovati {filteredItems.length} di {items.length}
            </span>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-10 opacity-50 text-xs">Nessun elemento corrisponde alla ricerca</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, idx) => {
              const title = getKeyValue(item, config.titleKey);
              const subtitle = getKeyValue(item, config.subtitleKey);
              const body = getKeyValue(item, config.bodyKey);
              const image = getKeyValue(item, config.imageKey);
              const badge = getKeyValue(item, config.badgeKey);
              const customColor = getKeyValue(item, config.colorKey);

              return (
                <div 
                  key={idx} 
                  className={`flex flex-col justify-between overflow-hidden p-4 border ${radiusClass} ${themeClasses.card}`}
                >
                  <div className="space-y-2.5">
                    {/* Badge & custom color accent indicator */}
                    <div className="flex justify-between items-center gap-2">
                      {badge ? (
                        <span className={`px-2 py-0.5 border text-[10px] font-semibold rounded-full ${themeClasses.badge}`}>
                          {String(badge)}
                        </span>
                      ) : <div />}
                      {customColor && (
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: String(customColor) }}
                        />
                      )}
                    </div>

                    {image && (
                      <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-200/10 mb-2">
                        <img 
                          src={String(image)} 
                          alt={String(title)} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div>
                      {title && (
                        <h4 
                          className={`font-bold line-clamp-2 leading-snug ${sizes.title}`}
                          style={customColor ? { color: customColor } : {}}
                        >
                          {String(title)}
                        </h4>
                      )}
                      {subtitle && (
                        <p className="text-xs font-semibold opacity-85 mt-0.5">
                          {String(subtitle)}
                        </p>
                      )}
                    </div>

                    {body && (
                      <p className={`text-xs opacity-75 line-clamp-4 leading-relaxed`}>
                        {String(body)}
                      </p>
                    )}
                  </div>

                  {/* Extra keys row */}
                  {(config.extraKeys || []).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dashed opacity-75 border-slate-500/20 text-[10px] grid grid-cols-2 gap-1.5">
                      {(config.extraKeys || []).map((key, i) => {
                        const val = getKeyValue(item, key);
                        if (val === undefined || val === null) return null;
                        return (
                          <div key={i} className="truncate">
                            <span className="font-semibold opacity-55 mr-1">{key}:</span>
                            <span className="font-mono">{String(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------
  // 3. LIST LAYOUT
  // ---------------------------------------------
  const renderList = () => {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {/* Search header inside iframe */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none opacity-50">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cerca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-1.5 text-xs rounded-md border bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500/40 ${themeClasses.border}`}
            />
          </div>
          {filteredItems.length !== items.length && (
            <span className="text-xs opacity-60 font-mono">
              Trovati {filteredItems.length} di {items.length}
            </span>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-10 opacity-50 text-xs">Nessun elemento corrisponde alla ricerca</div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, idx) => {
              const title = getKeyValue(item, config.titleKey);
              const subtitle = getKeyValue(item, config.subtitleKey);
              const body = getKeyValue(item, config.bodyKey);
              const image = getKeyValue(item, config.imageKey);
              const badge = getKeyValue(item, config.badgeKey);
              const customColor = getKeyValue(item, config.colorKey);

              return (
                <div 
                  key={idx} 
                  className={`flex flex-col sm:flex-row gap-4 p-4 border items-start ${radiusClass} ${themeClasses.card}`}
                >
                  {image && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200/10 shadow-sm mx-auto sm:mx-0">
                      <img 
                        src={String(image)} 
                        alt={String(title)} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 w-full space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {badge && (
                        <span className={`px-2 py-0.5 border text-[10px] font-semibold rounded-full ${themeClasses.badge}`}>
                          {String(badge)}
                        </span>
                      )}
                      {customColor && (
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: String(customColor) }}
                        />
                      )}
                    </div>

                    <div className="pt-0.5">
                      {title && (
                        <h4 
                          className={`font-bold ${sizes.title}`}
                          style={customColor ? { color: customColor } : {}}
                        >
                          {String(title)}
                        </h4>
                      )}
                      {subtitle && (
                        <p className="text-xs font-semibold opacity-85">
                          {String(subtitle)}
                        </p>
                      )}
                    </div>

                    {body && (
                      <p className="text-xs opacity-75 mt-1 leading-relaxed whitespace-pre-line">
                        {String(body)}
                      </p>
                    )}

                    {(config.extraKeys || []).length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-dashed border-slate-500/10 text-[10px] opacity-75">
                        {(config.extraKeys || []).map((key, i) => {
                          const val = getKeyValue(item, key);
                          if (val === undefined || val === null) return null;
                          return (
                            <div key={i}>
                              <span className="font-semibold opacity-55 mr-1">{key}:</span>
                              <span className="font-mono">{String(val)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------
  // 4. TABLE LAYOUT
  // ---------------------------------------------
  const renderTable = () => {
    // Get all unique keys from data if not mapped, to act as headers
    const sampleItem = items[0] || {};
    const tableKeys = Object.keys(sampleItem).filter(key => {
      // Exclude mapping values or long URLs to make it compact
      const val = sampleItem[key];
      return typeof val !== 'object' && String(val).length < 200;
    });

    return (
      <div className="p-4 md:p-6 space-y-4 overflow-x-auto">
        {/* Search header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none opacity-50">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Filtra tabella..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-1.5 text-xs rounded-md border bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500/40 ${themeClasses.border}`}
            />
          </div>
          <span className="text-xs opacity-60 font-mono">
            {filteredItems.length} righe
          </span>
        </div>

        <div className={`overflow-hidden border rounded-lg ${themeClasses.border}`}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${themeClasses.border} font-bold opacity-90`}>
                {tableKeys.map((key, i) => (
                  <th key={i} className="p-3 capitalize font-semibold tracking-wider">
                    {key.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  className={`border-b last:border-0 hover:bg-slate-500/5 transition-colors ${themeClasses.border}`}
                >
                  {tableKeys.map((key, colIdx) => {
                    const value = getKeyValue(item, key);
                    
                    // Style specific keys differently (e.g. badge, colors, statuses)
                    const isBadgeKey = key === config.badgeKey || key === 'status' || key === 'stato';
                    const isColorKey = key === config.colorKey || key === 'colore';

                    if (isColorKey && value) {
                      return (
                        <td key={colIdx} className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-400/20" style={{ backgroundColor: String(value) }} />
                            <span className="font-mono text-[10px]">{String(value)}</span>
                          </div>
                        </td>
                      );
                    }

                    if (isBadgeKey && value) {
                      return (
                        <td key={colIdx} className="p-3">
                          <span className={`px-2 py-0.5 border rounded-full font-semibold text-[10px] ${themeClasses.badge}`}>
                            {String(value)}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={colIdx} className="p-3 font-medium max-w-[200px] truncate">
                        {value !== undefined && value !== null ? String(value) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={tableKeys.length} className="text-center py-8 opacity-50">
                    Nessun dato corrispondente trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---------------------------------------------
  // 5. TICKER / BANNER LAYOUT
  // ---------------------------------------------
  const renderTicker = () => {
    const item = items[activeIndex];
    if (!item) return null;

    const title = getKeyValue(item, config.titleKey);
    const subtitle = getKeyValue(item, config.subtitleKey);
    const badge = getKeyValue(item, config.badgeKey);
    const customColor = getKeyValue(item, config.colorKey);

    return (
      <div className="w-full flex items-center justify-between px-4 py-3 min-h-[50px] relative overflow-hidden">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {badge && (
            <span className={`px-2 py-0.5 border text-[10px] font-bold rounded flex-shrink-0 ${themeClasses.badge}`}>
              {String(badge)}
            </span>
          )}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap items-center gap-x-2 text-xs md:text-sm font-medium truncate flex-1"
            >
              <span 
                className={`${themeClasses.textPrimary} font-bold`}
                style={customColor ? { color: customColor } : {}}
              >
                {String(title)}
              </span>
              {subtitle && (
                <span className="opacity-65 text-xs truncate">
                  - {String(subtitle)}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Ticker side-controls */}
        {items.length > 1 && (
          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0 z-10">
            <button 
              onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)}
              className="p-1 hover:scale-105 transition-transform"
            >
              <ChevronLeft className="w-3.5 h-3.5 opacity-65 hover:opacity-100" />
            </button>
            <span className="text-[10px] font-mono opacity-50">
              {activeIndex + 1}/{items.length}
            </span>
            <button 
              onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
              className="p-1 hover:scale-105 transition-transform"
            >
              <ChevronRight className="w-3.5 h-3.5 opacity-65 hover:opacity-100" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------
  // 6. HIGHLIGHTED METRIC LAYOUT
  // ---------------------------------------------
  const renderMetric = () => {
    const item = items[activeIndex];
    if (!item) return null;

    const title = getKeyValue(item, config.titleKey); // Metric Name (e.g. "Monthly Active Users")
    const subtitle = getKeyValue(item, config.subtitleKey); // Large Metric Value (e.g. "148,250")
    const body = getKeyValue(item, config.bodyKey); // Sub-metric / Trend (e.g. "+12.4% this month")
    const badge = getKeyValue(item, config.badgeKey); // Indicator Status (e.g. "Excellent")
    const customColor = getKeyValue(item, config.colorKey); // Indicators color

    return (
      <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-8 min-h-[250px]">
        <div className="flex justify-between items-start gap-4">
          <div>
            {title && (
              <h4 className="text-xs md:text-sm font-semibold tracking-wider uppercase opacity-65">
                {String(title)}
              </h4>
            )}
          </div>
          {/* Badge & Cycling controls */}
          <div className="flex items-center gap-2">
            {badge && (
              <span className={`px-2 py-0.5 border text-[10px] font-semibold rounded-full ${themeClasses.badge}`}>
                {String(badge)}
              </span>
            )}
            {items.length > 1 && (
              <div className="flex items-center gap-1 z-10 bg-slate-500/5 px-2 py-0.5 rounded-full border border-slate-500/10">
                <button 
                  onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)}
                  className="p-0.5 hover:scale-105"
                >
                  <ChevronLeft className="w-3 h-3 opacity-60 hover:opacity-100" />
                </button>
                <span className="text-[10px] font-mono opacity-50">{activeIndex + 1}/{items.length}</span>
                <button 
                  onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
                  className="p-0.5 hover:scale-105"
                >
                  <ChevronRight className="w-3 h-3 opacity-60 hover:opacity-100" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center my-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={animVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {subtitle && (
                <div 
                  className="text-4xl md:text-5xl font-black tracking-tight leading-none"
                  style={customColor ? { color: customColor } : {}}
                >
                  {String(subtitle)}
                </div>
              )}
              {body && (
                <p className="text-xs md:text-sm font-medium opacity-80 flex items-center gap-1">
                  {String(body)}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic decorative trend line or background highlight */}
        {customColor && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-1.5 opacity-60" 
            style={{ backgroundColor: String(customColor) }}
          />
        )}
      </div>
    );
  };

  // ---------------------------------------------
  // 7. INTERACTIVE QUIZ LAYOUT
  // ---------------------------------------------
  const renderQuiz = () => {
    const item = items[activeIndex];
    if (!item) return null;

    const question = getKeyValue(item, config.titleKey) || "Nessuna domanda trovata";
    const category = getKeyValue(item, config.subtitleKey) || "Quiz";
    const explanation = getKeyValue(item, config.bodyKey) || "";
    const difficulty = getKeyValue(item, config.badgeKey) || "";
    const customColor = getKeyValue(item, config.colorKey) || "#e2e8f0";

    // Auto-detect quiz options from item
    let options: string[] = [];
    if (Array.isArray(item.opzioni)) {
      options = item.opzioni;
    } else if (Array.isArray(item.options)) {
      options = item.options;
    } else {
      // Look for keys like "opzione_a", "opzione_1" etc.
      const optKeys = Object.keys(item).filter(k => 
        k.toLowerCase().includes('opzione') || 
        k.toLowerCase().includes('option') || 
        k.toLowerCase().includes('scelta')
      );
      if (optKeys.length > 0) {
        options = optKeys.map(k => String(item[k]));
      } else {
        options = ["Opzione A", "Opzione B", "Opzione C", "Opzione D"];
      }
    }

    // Auto-detect correct answer
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

    const handleOptionClick = (option: string) => {
      if (isAnswered) return;
      const isAnsCorrect = option === correctAnswer;
      
      setQuizAnswers(prev => ({ ...prev, [activeIndex]: option }));
      setQuizRevealed(prev => ({ ...prev, [activeIndex]: true }));
      
      if (isAnsCorrect) {
        setQuizStreak(prev => prev + 1);
      } else {
        setQuizStreak(0);
      }
    };

    return (
      <div className="p-4 md:p-6 space-y-4 min-h-[350px] flex flex-col justify-between text-[#1A1C1E]">
        {/* Header: Score and category */}
        <div className="flex justify-between items-center border-b-2 border-[#1A1C1E]/10 pb-2">
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full animate-pulse" 
              style={{ backgroundColor: customColor }}
            />
            <span className="font-mono text-xs uppercase font-bold tracking-tight opacity-75">{category}</span>
            {difficulty && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${themeClasses.badge}`}>
                {difficulty}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {quizStreak > 0 && (
              <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded-full text-[10px] font-bold animate-bounce">
                🔥 Streak: {quizStreak}
              </div>
            )}
            <div className="text-[10px] font-mono opacity-65 font-bold">
              Punteggio: {Object.keys(quizAnswers).filter((idxStr) => {
                const idx = parseInt(idxStr, 10);
                const qItem = items[idx];
                if (!qItem) return false;
                const correctAnsKey = Object.keys(qItem).find(k => 
                  k.toLowerCase().includes('corretta') || k.toLowerCase().includes('correct') || k.toLowerCase().includes('giusta')
                );
                const correct = correctAnsKey ? String(qItem[correctAnsKey]) : '';
                return quizAnswers[idx] === correct;
              }).length} / {Object.keys(quizAnswers).length || 0}
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="my-2 flex-1 flex flex-col justify-center">
          <h3 className="text-sm md:text-base font-display font-black leading-snug">
            {question}
          </h3>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {options.map((opt, index) => {
            const isThisSelected = selectedAnswer === opt;
            const isThisCorrect = opt === correctAnswer;
            
            let btnStyle = "bg-white text-[#1A1C1E] border-2 border-[#1A1C1E] hover:bg-[#FEF08A]/40";
            let icon = null;

            if (isAnswered) {
              if (isThisCorrect) {
                btnStyle = "bg-emerald-500 text-white border-2 border-emerald-700 shadow-sm";
                icon = <Check className="w-4 h-4 text-white" />;
              } else if (isThisSelected) {
                btnStyle = "bg-rose-500 text-white border-2 border-rose-700 shadow-sm";
                icon = <X className="w-4 h-4 text-white" />;
              } else {
                btnStyle = "bg-white text-[#1A1C1E]/50 border-2 border-[#1A1C1E]/30 opacity-60";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(opt)}
                disabled={isAnswered}
                className={`p-3 text-left rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${btnStyle} ${
                  !isAnswered ? "active:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(26,28,30,1)]" : ""
                }`}
              >
                <span className="flex-1 pr-2">{opt}</span>
                {icon}
              </button>
            );
          })}
        </div>

        {/* Explanation Alert panel */}
        <AnimatePresence>
          {isAnswered && explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 text-xs text-[#1A1C1E] mt-3 space-y-1"
            >
              <div className="flex items-center gap-1.5 font-bold text-yellow-800">
                <Lightbulb className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <span>{isCorrect ? "Corretto!" : "Non proprio..."} Spiegazione:</span>
              </div>
              <p className="font-medium opacity-90 leading-relaxed font-sans">{explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer controls for carousel-like questions */}
        <div className="flex items-center justify-between mt-4 pt-2 border-t border-[#1A1C1E]/10">
          <button
            onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)}
            className="px-3 py-1.5 rounded-lg border-2 border-[#1A1C1E] text-[11px] font-bold uppercase tracking-tight bg-white hover:bg-slate-50 transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Indietro
          </button>
          
          <span className="font-mono text-xs font-bold opacity-60">
            {activeIndex + 1} / {items.length}
          </span>

          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
            className="px-3 py-1.5 rounded-lg border-2 border-[#1A1C1E] text-[11px] font-bold uppercase tracking-tight bg-[#FEF08A] hover:bg-yellow-300 transition-all flex items-center gap-1 cursor-pointer"
          >
            Avanti <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------
  // 8. MULTIMEDIA VIDEO PLAYLIST & PLAYER LAYOUT
  // ---------------------------------------------
  const renderVideo = () => {
    const activeItem = items[selectedVideoIndex] || items[0];
    if (!activeItem) return null;

    const title = getKeyValue(activeItem, config.titleKey) || "Senza Titolo";
    const description = getKeyValue(activeItem, config.bodyKey) || "";
    const thumbnail = getKeyValue(activeItem, config.imageKey) || "";
    const badge = getKeyValue(activeItem, config.badgeKey) || "";
    const channel = getKeyValue(activeItem, config.subtitleKey) || "";

    // Extract YouTube ID using a robust helper
    const getYTId = (val: any): string => {
      if (!val || typeof val !== 'string') return "dQw4w9WgXcQ";
      const str = val.trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
      const match = str.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
      if (match && match[1]) return match[1];
      const matchFallback = str.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:&|\?|$)/);
      if (matchFallback && matchFallback[1]) return matchFallback[1];
      return "dQw4w9WgXcQ";
    };

    const rawVideoVal = config.videoKey ? getKeyValue(activeItem, config.videoKey) : undefined;
    const youtubeId = rawVideoVal 
      ? getYTId(rawVideoVal) 
      : getYTId(activeItem.youtube_id || activeItem.video_id || activeItem.video_url || "dQw4w9WgXcQ");

    return (
      <div className="p-4 md:p-6 space-y-4 text-[#1A1C1E]">
        {/* Main Active Player */}
        <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border-2 border-[#1A1C1E] shadow-[4px_4px_0px_0px_rgba(26,28,30,1)]">
          {isPlayingVideo ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex flex-col justify-end">
              {thumbnail ? (
                <img 
                  src={thumbnail} 
                  alt={title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                  <Tv className="w-16 h-16 text-slate-700" />
                </div>
              )}
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              {/* Play Button */}
              <button
                onClick={() => setIsPlayingVideo(true)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FEF08A] hover:bg-yellow-400 hover:scale-110 active:scale-95 text-[#1A1C1E] p-4 rounded-full border-2 border-[#1A1C1E] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10"
              >
                <Play className="w-8 h-8 fill-current" />
              </button>

              {/* Text Info overlay */}
              <div className="relative p-4 text-white z-10 space-y-1 pointer-events-none">
                <div className="flex items-center gap-2 text-left">
                  {badge && (
                    <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight">
                      {badge}
                    </span>
                  )}
                  {channel && (
                    <span className="text-[10px] font-mono text-slate-300 uppercase font-bold tracking-wider">
                      {channel}
                    </span>
                  )}
                </div>
                <h3 className="text-sm md:text-base font-bold text-white tracking-tight line-clamp-1 text-left">
                  {title}
                </h3>
              </div>
            </div>
          )}
        </div>

        {/* Playing Video Details */}
        <div className="space-y-1.5 border-b-2 border-[#1A1C1E]/10 pb-3 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-display font-black leading-snug">
              {title}
            </h2>
            {channel && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${themeClasses.badge}`}>
                {channel}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-600 leading-relaxed font-sans line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Playlist Items */}
        <div className="space-y-2 text-left">
          <h4 className="text-xs font-display font-black uppercase tracking-tight">
            Playlist ({items.length} Video)
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {items.map((vItem, idx) => {
              const isActive = selectedVideoIndex === idx;
              const vTitle = getKeyValue(vItem, config.titleKey) || "Senza Titolo";
              const vChannel = getKeyValue(vItem, config.subtitleKey) || "";
              const vDuration = getKeyValue(vItem, config.badgeKey) || "";
              const vThumbnail = getKeyValue(vItem, config.imageKey) || "";

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedVideoIndex(idx);
                    setIsPlayingVideo(false);
                  }}
                  className={`p-2 rounded-lg border-2 flex gap-3 items-center transition-all cursor-pointer ${
                    isActive 
                      ? "bg-[#FEF08A]/30 border-[#1A1C1E] shadow-[2px_2px_0px_0px_rgba(26,28,30,1)]" 
                      : "bg-white border-transparent hover:border-[#1A1C1E]/50 hover:bg-slate-50"
                  }`}
                >
                  {/* Small Thumbnail preview */}
                  <div className="w-16 aspect-video bg-slate-900 rounded border border-[#1A1C1E]/10 overflow-hidden flex-shrink-0 relative">
                    {vThumbnail ? (
                      <img src={vThumbnail} alt={vTitle} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    )}
                    {vDuration && (
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white px-0.5 py-0.2 text-[8px] font-mono rounded">
                        {vDuration}
                      </span>
                    )}
                  </div>

                  {/* Text meta */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold truncate leading-tight">
                      {vTitle}
                    </h5>
                    {vChannel && (
                      <p className="text-[10px] font-mono text-slate-500 truncate leading-tight mt-0.5">
                        {vChannel}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------
  // 9. FLASHCARD MEMORIZATION LAYOUT
  // ---------------------------------------------
  const renderFlashcard = () => {
    const item = items[activeIndex];
    if (!item) return null;

    const front = getKeyValue(item, config.titleKey) || "Fronte della carta";
    const back = getKeyValue(item, config.bodyKey) || "Retro della carta";
    const hint = getKeyValue(item, config.subtitleKey) || "";
    const category = getKeyValue(item, config.badgeKey) || "Flashcard";
    const customColor = getKeyValue(item, config.colorKey) || "#10b981";

    const isFlipped = flashcardFlipped[activeIndex] || false;
    const isHintVisible = flashcardHint[activeIndex] || false;

    const toggleFlip = () => {
      setFlashcardFlipped(prev => ({ ...prev, [activeIndex]: !isFlipped }));
    };

    const toggleHint = (e: React.MouseEvent) => {
      e.stopPropagation(); // Avoid flipping when clicking the hint button
      setFlashcardHint(prev => ({ ...prev, [activeIndex]: !isHintVisible }));
    };

    return (
      <div className="p-4 md:p-6 space-y-4 min-h-[350px] flex flex-col justify-between text-[#1A1C1E]">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-[#1A1C1E]/10 pb-2">
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full animate-pulse" 
              style={{ backgroundColor: customColor }}
            />
            <span className="font-mono text-xs uppercase font-bold tracking-tight opacity-75">{category}</span>
            {(item.level || item.livello) && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#1A1C1E] text-white uppercase tracking-tighter">
                {item.level || item.livello}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono opacity-60">
            Clicca sulla carta per scoprirla
          </span>
        </div>

        {/* Flashcard container with animations */}
        <div className="my-4 flex-1 flex flex-col justify-center items-center">
          <div 
            onClick={toggleFlip}
            className={`w-full max-w-sm min-h-[220px] p-5 rounded-xl border-2 border-[#1A1C1E] flex flex-col justify-between cursor-pointer transition-all duration-300 select-none ${
              isFlipped 
                ? "bg-[#FEF08A]/10 shadow-[3px_3px_0px_0px_rgba(26,28,30,1)]" 
                : "bg-white shadow-[5px_5px_0px_0px_rgba(26,28,30,1)]"
            }`}
          >
            {/* Top tag inside card */}
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-400">
                {isFlipped ? "Traduzione / Spiegazione 🎯" : "Termine / Vocabolo 🤔"}
              </span>
              {!isFlipped && hint && (
                <button
                  onClick={toggleHint}
                  className="px-2 py-0.5 rounded border border-[#1A1C1E] text-[9px] font-bold font-mono bg-yellow-100 hover:bg-yellow-200 transition-all cursor-pointer"
                >
                  {isHintVisible ? "Nascondi indizio" : "Mostra indizio"}
                </button>
              )}
            </div>

            {/* Main content inside card */}
            <div className="my-3 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isFlipped ? 'back' : 'front'}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-display font-black text-[#1A1C1E] leading-snug"
                >
                  {isFlipped ? (
                    <div className="space-y-3 text-left">
                      <p className="text-sm md:text-base font-display font-black text-center text-slate-800">
                        {back}
                      </p>
                      
                      {/* Language learning example sentence if present */}
                      {(item.example || item.esempio) && (
                        <div className="mt-2.5 pt-2.5 border-t border-dashed border-[#1A1C1E]/15 text-left space-y-1 bg-amber-50/30 p-2 rounded">
                          <p className="text-[8px] uppercase font-mono font-bold text-slate-400 tracking-wider">Frase di esempio:</p>
                          <p className="text-xs font-bold text-slate-800 leading-tight">{item.example || item.esempio}</p>
                          {(item.examplePron || item.pronunciaEsempio) && (
                            <p className="text-[9px] italic text-slate-500 font-mono">[{item.examplePron || item.pronunciaEsempio}]</p>
                          )}
                          {(item.exampleTrans || item.traduzioneEsempio) && (
                            <p className="text-[11px] text-slate-600 leading-snug">{item.exampleTrans || item.traduzioneEsempio}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-xl md:text-2xl font-display font-black text-center tracking-tight text-[#1A1C1E]">
                        {front}
                      </p>
                      {/* Pronunciation from dedicated key or subtitleKey (hint) if defined */}
                      {(item.pronunciation || item.pronuncia || (hint && hint !== front)) && (
                        <p className="text-xs font-mono text-slate-500 italic text-center">
                          [{item.pronunciation || item.pronuncia || hint}]
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Hint / flipped footer inside card */}
            <div className="min-h-[20px] flex items-center justify-center">
              {!isFlipped && isHintVisible && hint && (
                <motion.p 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] font-mono text-center text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200/50 w-full"
                >
                  💡 {hint}
                </motion.p>
              )}
              {isFlipped && (
                <span className="text-[9px] font-mono text-emerald-600 font-bold tracking-tight bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✔ Scoperto! Clicca di nuovo per rigirare
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1A1C1E]/10">
          <button
            onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)}
            className="px-3 py-1.5 rounded-lg border-2 border-[#1A1C1E] text-[11px] font-bold uppercase tracking-tight bg-white hover:bg-slate-50 transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Indietro
          </button>
          
          <span className="font-mono text-xs font-bold opacity-60">
            {activeIndex + 1} / {items.length}
          </span>

          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
            className="px-3 py-1.5 rounded-lg border-2 border-[#1A1C1E] text-[11px] font-bold uppercase tracking-tight bg-[#FEF08A] hover:bg-yellow-300 transition-all flex items-center gap-1 cursor-pointer"
          >
            Avanti <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------
  // 10. RAW BEAUTIFIED JSON VIEW
  // ---------------------------------------------
  const renderRaw = () => {
    return (
      <div className="p-4 md:p-6 space-y-3">
        <div className="flex items-center justify-between text-xs opacity-70">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold">Visualizzatore Raw JSON (Struttura Dati)</span>
          </div>
          <span className="font-mono">{items.length} elementi rilevati</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-xs p-4 rounded-lg overflow-auto max-h-[400px]">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    );
  };

  // SELECT LAYOUT RENDERER
  const getLayoutContent = () => {
    switch (config.layout) {
      case 'carousel': return renderCarousel();
      case 'grid': return renderGrid();
      case 'list': return renderList();
      case 'table': return renderTable();
      case 'ticker': return renderTicker();
      case 'metric': return renderMetric();
      case 'quiz': return renderQuiz();
      case 'video': return renderVideo();
      case 'flashcard': return renderFlashcard();
      case 'raw': return renderRaw();
      default: return renderCarousel();
    }
  };

  return (
    <div 
      className={`w-full relative border flex flex-col justify-between transition-colors overflow-hidden ${radiusClass} ${themeClasses.container}`}
      style={getContainerStyle()}
    >
      {/* Dynamic refresh indicator */}
      {isLoading && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 text-[10px] animate-pulse z-20">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
          Ricarica automatica...
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1">
        {getLayoutContent()}
      </div>

      {/* Universal Footer: Show auto-update metadata if in Iframe Mode or Configurator wants to check */}
      {(!isIframeMode || config.refreshInterval > 0) && (
        <div className={`px-4 py-2 flex justify-between items-center text-[10px] border-t opacity-55 ${themeClasses.border}`}>
          <div className="flex items-center gap-1">
            <span className="font-mono">JSON Reader</span>
            {lastUpdated && (
              <span className="opacity-80">
                • Aggiornato alle: {formatTime(lastUpdated)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {config.refreshInterval > 0 && (
              <span>Ricarica: ogni {config.refreshInterval}s</span>
            )}
            {onManualRefresh && (
              <button 
                onClick={handleRefreshClick}
                className="p-1 hover:scale-110 hover:opacity-100 transition-all cursor-pointer"
                title="Aggiorna ora manualmente"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingEffect ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
