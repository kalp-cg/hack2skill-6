import { Component, type ErrorInfo, type ReactNode } from 'react';
import { surface } from './styles';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Changing this value (e.g. the active tab) clears a previous error. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Contains render errors and failed lazy-chunk loads (e.g. a flaky 3G connection) to the view
 * that failed, so the header, navigation and other tabs keep working. Recovery is a reload because
 * React.lazy caches a failed import; all user state is persisted, so nothing is lost.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SaansSaathi view crashed:', error, info.componentStack);
  }

  componentDidUpdate(previous: ErrorBoundaryProps) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className={`${surface.panel} text-center`}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">This view could not be loaded.</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Your plan and settings are saved on this device. Check your connection and reload, or switch to another tab.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer"
        >
          Reload
        </button>
      </div>
    );
  }
}
