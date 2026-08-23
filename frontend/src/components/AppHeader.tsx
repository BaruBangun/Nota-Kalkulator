import { Link, useLocation } from 'react-router-dom';
import { Clock3, Settings2 } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { btnGhost, btnSize } from '@/lib/styles';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/history', label: 'Riwayat', icon: Clock3, testId: 'nav-history' },
  { to: '/settings', label: 'Pengaturan', icon: Settings2, testId: 'nav-settings' },
];

export const AppHeader = () => {
  const { pathname } = useLocation();

  return (
    <header
      className="sticky top-0 z-40 border-b border-border glass no-print"
      data-testid="app-header"
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-full pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="brand-home-link"
        >
          <BrandMark className="h-9 w-9" />
          <span className="font-mono text-base font-semibold tracking-tight">NotaKalk</span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Navigasi utama">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                data-testid={item.testId}
                className={cn(
                  btnGhost,
                  btnSize.sm,
                  'gap-2 px-3',
                  active && 'bg-secondary text-foreground',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="hidden text-sm sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
