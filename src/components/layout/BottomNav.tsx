import type { HomeTab } from '../../types/saans';
import type { NavItem } from './navItems';

interface BottomNavProps {
  navItems: NavItem[];
  activeTab: HomeTab | null;
  onNavigate: (tab: HomeTab) => void;
}

/** Fixed thumb-reach tab bar on phones (hidden from `md` up, where the header nav takes over). */
export function BottomNav({ navItems, activeTab, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm pb-safe md:hidden"
    >
      <div className="grid h-[60px] grid-cols-5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
                active ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate max-w-[68px]">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
