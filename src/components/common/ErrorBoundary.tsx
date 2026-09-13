import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RepoTale uncaught UI error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('repotale_custom_story');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#080a0f] text-slate-200 p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-base-200 border border-base-300 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-error/20 border border-error/30 flex items-center justify-center text-error">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight">Something went wrong</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected render error occurred in the active story view.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-lg bg-base-100 border border-base-300 text-[11px] font-mono text-error/90 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn btn-neutral btn-sm flex-1 font-medium gap-1.5 border-base-300 text-slate-300 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={this.handleReset}
                className="btn btn-primary btn-sm flex-1 font-medium gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reset to RepoTale</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
