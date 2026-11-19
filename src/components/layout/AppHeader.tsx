import { Info, Moon, Settings, Sun } from 'lucide-react';
import type { AirSnapshot, HomeTab } from '../../types/saans';
import { PWAInstallButton } from '../saans/PwaControls';
import type { NavItem } from './navItems';

interface AppHeaderProps {
  air: AirSnapshot;
  navItems: NavItem[];
  /** Highlighted tab, or null while a full-screen view (Emergency Mode) is open. */
  activeTab: HomeTab | null;
  darkMode: boolean;
  onNavigate: (tab: HomeTab) => void;
  onToggleDarkMode: () => void;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
}

const iconButton =
  'flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer';

/** Sticky top bar: brand + live AQI, desktop tab navigation, install, about, theme and settings. */
export function AppHeader({
  air,
  navItems,
  activeTab,
  darkMode,
  onNavigate,
  onToggleDarkMode,
  onOpenAbout,
  onOpenSettings,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[52px] md:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('today')}
          className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
        >
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">SaansSaathi</div>
            <div className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">
              {air.city.name} · AQI <span className="font-mono font-semibold tabular-nums">{air.aqi}</span>
            </div>
          </div>
        </button>

        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(id)}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden lg:block">
            <PWAInstallButton compact />
          </div>
          <button
            type="button"
            onClick={onOpenAbout}
            aria-label="About and how it works"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">How It Works</span>
          </button>
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className={iconButton}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings and accessibility"
            className={iconButton}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
