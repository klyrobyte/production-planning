import { create } from 'zustand';
import api from '../lib/axios';

interface ThemeState {
  colorPrimary: string;
  colorSecondary: string;
  colorNavbar: string;
  systemTitle: string;
  systemLogo: string;
  browserTitle: string;
  isLoading: boolean;
  fetchTheme: () => Promise<void>;
  updateTheme: (config: { 
    color_primary?: string; 
    color_secondary?: string; 
    color_navbar?: string;
    system_title?: string;
    system_logo?: string;
    browser_title?: string;
  }) => Promise<void>;
}

// Apply colors, system title, browser tab title, and system logo dynamically to document and browser tab
const applyThemeToDOM = (primary: string, secondary: string, navbar: string, browserTitle: string, logo: string) => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-navbar', navbar);

  // Update browser tab title
  document.title = browserTitle || 'frontend';

  // Update browser tab favicon dynamically
  const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (favicon) {
    favicon.href = logo || '/favicon.svg';
    if (logo && logo.startsWith('data:')) {
      favicon.removeAttribute('type');
    } else {
      favicon.setAttribute('type', 'image/svg+xml');
    }
  }
};

// Manage website theme settings and apply brand colors to CSS variables
export const useThemeStore = create<ThemeState>((set) => ({
  colorPrimary: '#008d51',
  colorSecondary: '#E76114',
  colorNavbar: '#037233',
  systemTitle: 'PT. Sugity Creatives',
  systemLogo: '',
  browserTitle: 'frontend',
  isLoading: false,

  // Fetch current site configuration from backend and update styles
  fetchTheme: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/site-config');
      const data = response.data || {};
      const primary = data.color_primary || '#008d51';
      const secondary = data.color_secondary || '#E76114';
      const navbar = data.color_navbar || '#037233';
      const title = data.system_title || 'PT. Sugity Creatives';
      const logo = data.system_logo || '';
      const bTitle = data.browser_title || 'frontend';
      
      applyThemeToDOM(primary, secondary, navbar, bTitle, logo);
      set({ 
        colorPrimary: primary, 
        colorSecondary: secondary, 
        colorNavbar: navbar,
        systemTitle: title,
        systemLogo: logo,
        browserTitle: bTitle,
      });
    } catch (err) {
      console.error('Failed to load site config theme:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Save updated brand colors and info to database and refresh DOM variables
  updateTheme: async (config) => {
    set({ isLoading: true });
    try {
      const response = await api.put('/site-config', config);
      const data = response.data || {};
      const primary = data.color_primary || '#008d51';
      const secondary = data.color_secondary || '#E76114';
      const navbar = data.color_navbar || '#037233';
      const title = data.system_title || 'PT. Sugity Creatives';
      const logo = data.system_logo || '';
      const bTitle = data.browser_title || 'frontend';

      applyThemeToDOM(primary, secondary, navbar, bTitle, logo);
      set({ 
        colorPrimary: primary, 
        colorSecondary: secondary, 
        colorNavbar: navbar,
        systemTitle: title,
        systemLogo: logo,
        browserTitle: bTitle,
      });
    } catch (err) {
      console.error('Failed to update theme config:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
