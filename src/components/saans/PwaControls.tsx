import { Download, Share, WifiOff, X } from 'lucide-react';
import { useState } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ModalShell } from '../ui/ModalShell';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/80 px-4 py-2 text-center text-xs font-medium text-amber-950 dark:text-amber-200"
    >
      <span className="inline-flex items-center gap-1.5">
        <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
        <span>You’re offline — showing your cached AQI telemetry &amp; last SaansSaathi daily plan.</span>
      </span>
    </div>
  );
}

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (!isInstallable && !isIOS) {
    return compact ? null : (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 text-xs text-slate-600 dark:text-slate-300">
        SaansSaathi is PWA-ready with offline plan caching. Use your browser menu (“Install app” or “Add to Home
        Screen”) to install.
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (isIOS ? setShowIOSGuide(true) : void install())}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
          compact
            ? 'min-h-[38px] border border-teal-700 bg-teal-50 dark:bg-teal-950/60 px-3 text-xs text-teal-800 dark:text-teal-300 hover:bg-teal-100'
            : 'min-h-[44px] w-full bg-teal-700 px-4 text-xs text-white hover:bg-teal-800'
        }`}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>Install SaansSaathi App</span>
      </button>

      {showIOSGuide && (
        <ModalShell
          variant="center"
          onClose={() => setShowIOSGuide(false)}
          labelledBy="ios-install-title"
          panelClassName="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h3 id="ios-install-title" className="text-base font-bold text-slate-900 dark:text-white">
              Install on iPhone / iPad
            </h3>
            <button
              type="button"
              aria-label="Close install instructions"
              onClick={() => setShowIOSGuide(false)}
              className="rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ol className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <Share className="h-4 w-4 text-teal-700 shrink-0" />
              <span>1. Tap the Share button in Safari’s bottom bar.</span>
            </li>
            <li>2. Scroll down and tap “Add to Home Screen”.</li>
            <li>3. Tap “Add” to launch SaansSaathi offline anytime.</li>
          </ol>
        </ModalShell>
      )}
    </>
  );
}
