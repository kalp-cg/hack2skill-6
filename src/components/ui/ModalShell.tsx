import { type ReactNode, useEffect } from 'react';

interface ModalShellProps {
  onClose: () => void;
  /** id of the visible heading that names the dialog (preferred), or a plain `label`. */
  labelledBy?: string;
  label?: string;
  /** Size, padding and radius of the content panel. */
  panelClassName: string;
  /** `sheet` docks to the bottom on phones and centres from `sm` up; `center` is always centred. */
  variant?: 'sheet' | 'center';
  children: ReactNode;
}

/**
 * Shared modal frame: dims the page, closes on Escape or a backdrop click, and keeps the
 * backdrop out of the tab order (keyboard users close via Escape or the dialog's own button).
 */
export function ModalShell({
  onClose,
  labelledBy,
  label,
  panelClassName,
  variant = 'sheet',
  children,
}: ModalShellProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const placement = variant === 'sheet' ? 'items-end sm:items-center sm:p-4' : 'items-center p-4';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className={`fixed inset-0 z-50 flex justify-center ${placement}`}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-xs"
      />
      <div className={`relative ${panelClassName}`}>{children}</div>
    </div>
  );
}
