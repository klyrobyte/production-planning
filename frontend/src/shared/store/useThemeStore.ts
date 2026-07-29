import { create } from 'zustand';
import api from '../lib/axios';

interface ThemeState {
  colorPrimary: string;
  colorSecondary: string;
  colorNavbar: string;
  systemTitle: string;
  systemLogo: string;
  browserTitle: string;
  machineTypes: string;
  abnormalityTypes: string;
  isLoading: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  fetchTheme: () => Promise<void>;
  updateTheme: (config: { 
    color_primary?: string; 
    color_secondary?: string; 
    color_navbar?: string;
    system_title?: string;
    system_logo?: string;
    browser_title?: string;
    machine_types?: string;
    abnormality_types?: string;
  }) => Promise<void>;
}

// Apply colors, system title, browser tab title, system logo, and dark mode class to DOM
const applyThemeToDOM = (primary: string, secondary: string, navbar: string, browserTitle: string, logo: string) => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-navbar', navbar);

  // Sync dark mode class from localStorage
  const isDark = localStorage.getItem('sugity_dark_mode') === 'true';
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Update browser tab title
  document.title = browserTitle || 'SC Prod Plan';

  // Update browser tab favicon dynamically
  const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (favicon) {
    const finalLogo = logo || '/logo.png';
    favicon.href = finalLogo;
    if (finalLogo.endsWith('.png') || finalLogo.startsWith('data:image/png')) {
      favicon.setAttribute('type', 'image/png');
    } else if (finalLogo.endsWith('.svg') || finalLogo.startsWith('data:image/svg')) {
      favicon.setAttribute('type', 'image/svg+xml');
    } else {
      favicon.removeAttribute('type');
    }
  }
};

const DEFAULT_ABNORMALITY_TYPES =
  'Mesin Breakdown (Mekanik),Tunggu Bahan Baku,Tunggu Crane / Mold Swap,Listrik Padam,Masalah Kualitas (Investigasi),Trial Mold / Part Baru,Lainnya';

// Manage website theme settings and apply brand colors to CSS variables
export const useThemeStore = create<ThemeState>((set) => ({
  colorPrimary: '#008d51',
  colorSecondary: '#E76114',
  colorNavbar: '#037233',
  systemTitle: 'PT. Sugity Creatives',
  systemLogo: '/logo.png',
  browserTitle: 'SC Prod Plan',
  machineTypes: 'injection,painting',
  abnormalityTypes: DEFAULT_ABNORMALITY_TYPES,
  isLoading: false,
  darkMode: localStorage.getItem('sugity_dark_mode') === 'true',

  // Toggle dark/light mode and persist to localStorage
  toggleDarkMode: () => {
    set((state) => {
      const newMode = !state.darkMode;
      localStorage.setItem('sugity_dark_mode', String(newMode));
      
      const root = document.documentElement;
      if (newMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      return { darkMode: newMode };
    });
  },

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
      const logo = data.system_logo || '/logo.png';
      const bTitle = data.browser_title || 'SC Prod Plan';
      const mTypes = data.machine_types || 'injection,painting';
      const abnTypes = data.abnormality_types || DEFAULT_ABNORMALITY_TYPES;
      
      applyThemeToDOM(primary, secondary, navbar, bTitle, logo);
      set({ 
        colorPrimary: primary, 
        colorSecondary: secondary, 
        colorNavbar: navbar,
        systemTitle: title,
        systemLogo: logo,
        browserTitle: bTitle,
        machineTypes: mTypes,
        abnormalityTypes: abnTypes,
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
      const logo = data.system_logo || '/logo.png';
      const bTitle = data.browser_title || 'SC Prod Plan';
      const mTypes = data.machine_types || 'injection,painting';
      const abnTypes = data.abnormality_types || DEFAULT_ABNORMALITY_TYPES;

      applyThemeToDOM(primary, secondary, navbar, bTitle, logo);
      set({ 
        colorPrimary: primary, 
        colorSecondary: secondary, 
        colorNavbar: navbar,
        systemTitle: title,
        systemLogo: logo,
        browserTitle: bTitle,
        machineTypes: mTypes,
        abnormalityTypes: abnTypes,
      });
    } catch (err) {
      console.error('Failed to update theme config:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Apply default values immediately to DOM on script execution to prevent lag or flash of default titles
applyThemeToDOM('#008d51', '#E76114', '#037233', 'SC Prod Plan', '/logo.png');
