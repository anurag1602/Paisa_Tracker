import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class RootErrorBoundary extends Error {
  static from(error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error: RootErrorBoundary.from(error) };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Paisa Tracker runtime crash:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0b0b13',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ maxWidth: 680, textAlign: 'left' }}>
            <h2 style={{ marginBottom: 12 }}>App crashed at runtime</h2>
            <p style={{ marginBottom: 12, color: '#94a3b8' }}>
              If this happens on Vercel, open browser DevTools Console and copy
              the error shown there.
            </p>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: 8,
                padding: 12,
                color: '#fca5a5',
              }}
            >
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
