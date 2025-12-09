import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 bg-red-50 rounded-2xl border border-red-100 m-4">
                    <div className="bg-red-100 p-4 rounded-full mb-4">
                        <AlertTriangle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 text-center mb-6 max-w-md">
                        We encountered an unexpected error while loading this section.
                    </p>

                    {/* Show error details only in development or if critical */}
                    <div className="w-full max-w-lg bg-white p-4 rounded-lg border border-red-200 shadow-sm overflow-auto max-h-40 mb-6 text-xs font-mono text-red-800">
                        {this.state.error && this.state.error.toString()}
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
