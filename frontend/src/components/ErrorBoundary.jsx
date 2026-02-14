import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="container" style={{ padding: '2rem' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h1 style={{ color: '#e74c3c' }}>⚠️ Something went wrong</h1>
                        <p style={{ marginBottom: '1rem' }}>
                            We're sorry, but something unexpected happened. Please try refreshing the page.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Refresh Page
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={{ marginTop: '2rem', textAlign: 'left' }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                    Error Details (Development Only)
                                </summary>
                                <pre style={{
                                    backgroundColor: '#f4f4f4',
                                    padding: '1rem',
                                    borderRadius: '4px',
                                    overflow: 'auto',
                                    fontSize: '0.875rem'
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
