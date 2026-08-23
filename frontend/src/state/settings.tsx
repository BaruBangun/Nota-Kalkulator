import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getSettings, saveSettings } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/types/note';
import type { Settings, ThemeMode } from '@/types/note';

const THEME_KEY = 'notakalk.theme';
const PRINT_KEY = 'notakalk.printSize';

interface SettingsContextValue {
  settings: Settings;
  resolvedTheme: 'light' | 'dark';
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') return prefersDark() ? 'dark' : 'light';
  return theme;
}

function bootTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : DEFAULT_SETTINGS.theme;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => ({
    theme: bootTheme(),
    printSize: localStorage.getItem(PRINT_KEY) === 'thermal' ? 'thermal' : 'a4',
  }));
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolve(bootTheme()));

  useEffect(() => {
    let alive = true;
    getSettings().then((stored) => {
      if (alive) setSettings(stored);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const apply = () => {
      const next = resolve(settings.theme);
      setResolvedTheme(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    };
    apply();
    localStorage.setItem(THEME_KEY, settings.theme);
    localStorage.setItem(PRINT_KEY, settings.printSize);
    document.documentElement.setAttribute('data-print', settings.printSize);

    if (settings.theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, resolvedTheme, update }),
    [settings, resolvedTheme, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings harus dipakai di dalam SettingsProvider');
  return context;
}
