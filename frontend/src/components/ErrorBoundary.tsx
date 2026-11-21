import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

/**
 * Zachytí chybu při renderu modulu a zabrání tomu, aby celá aplikace
 * skončila na prázdné obrazovce.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[Hestia] Chyba při renderu komponenty:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900 dark:text-white">
                Tuto obrazovku se nepodařilo zobrazit
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Došlo k neočekávané chybě. Zkuste stránku obnovit.
              </p>
              {this.state.message && (
                <p className="mt-2 text-[11px] font-mono text-rose-600 dark:text-rose-400 break-words">
                  {this.state.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Obnovit stránku
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
