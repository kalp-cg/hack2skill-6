import { BarChart3, CalendarCheck, type LucideIcon, MessageCircle, Users, Wind } from 'lucide-react';
import { UI_COPY } from '../../data/i18n';
import type { AppLanguage, HomeTab } from '../../types/saans';

export interface NavItem {
  id: HomeTab;
  label: string;
  icon: LucideIcon;
}

/** The five primary tabs, labelled in the active language. Shared by the desktop and mobile navs. */
export function getNavItems(language: AppLanguage): NavItem[] {
  const { tabs } = UI_COPY[language];
  return [
    { id: 'today', label: tabs.today, icon: Wind },
    { id: 'plan', label: tabs.plan, icon: CalendarCheck },
    { id: 'impact', label: tabs.impact, icon: BarChart3 },
    { id: 'ask', label: tabs.ask, icon: MessageCircle },
    { id: 'community', label: tabs.community, icon: Users },
  ];
}
