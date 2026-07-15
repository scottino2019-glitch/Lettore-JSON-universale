export type WidgetLayout = 'carousel' | 'grid' | 'list' | 'table' | 'ticker' | 'metric' | 'quiz' | 'video' | 'flashcard' | 'raw';

export type WidgetTheme = 'light' | 'dark' | 'glass' | 'corporate' | 'retro' | 'playful' | 'highdensity';

export interface WidgetConfig {
  url: string;
  layout: WidgetLayout;
  refreshInterval: number; // in seconds, 0 = disabled
  cycleInterval: number; // in seconds (for carousel / ticker)
  theme: WidgetTheme;
  titleKey: string;
  subtitleKey: string;
  bodyKey: string;
  imageKey: string;
  colorKey: string;
  badgeKey: string;
  extraKeys: string[];
  fontSize: 'sm' | 'base' | 'lg';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  autoplay: boolean;
  animation: 'fade' | 'slide' | 'scale';
  customStyles: {
    bgColor: string;
    textColor: string;
    accentColor: string;
  };
}

export interface SampleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  data: any;
  defaultConfig: Partial<WidgetConfig>;
}
