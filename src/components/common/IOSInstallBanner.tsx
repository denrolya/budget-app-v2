import { Share, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'ios-install-dismissed';

const isIOS = () =>
  typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

const isStandalone = () =>
  typeof window !== 'undefined' && (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const IOSInstallBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIOS() || isStandalone()) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // ignore
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  };

  return (
    <div className="md:hidden shrink-0 flex items-center gap-2 px-3 py-2 bg-card border-t text-2xs text-muted-foreground">
      <Share aria-hidden className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="flex-1 leading-snug">
        Tap <strong className="text-foreground">Share</strong> then{' '}
        <strong className="text-foreground">"Add to Home Screen"</strong> for the best experience
      </span>
      <button
        aria-label="Dismiss install banner"
        type="button"
        className="shrink-0 p-1 rounded hover:bg-muted/60 transition-colors"
        onClick={dismiss}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default IOSInstallBanner;
