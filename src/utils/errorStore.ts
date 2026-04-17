type ErrorLog = {
  id: string;
  message: string;
  source?: string;
  timestamp: number;
  status: 'pending' | 'healing' | 'healed' | 'failed';
  solution?: string;
};

class ErrorStore {
  private logs: ErrorLog[] = [];
  private listeners: Set<() => void> = new Set();

  addError(message: string, source?: string) {
    // Prevent duplicate spam
    if (this.logs.some(l => l.message === message && Date.now() - l.timestamp < 5000)) return;

    const newLog: ErrorLog = {
      id: Math.random().toString(36).substring(7),
      message,
      source,
      timestamp: Date.now(),
      status: 'pending'
    };
    this.logs = [newLog, ...this.logs].slice(0, 50); // Keep last 50
    this.notify();
  }

  updateError(id: string, updates: Partial<ErrorLog>) {
    this.logs = this.logs.map(log => log.id === id ? { ...log, ...updates } : log);
    this.notify();
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}

export const errorStore = new ErrorStore();

// Initialize global interceptors
export const initErrorInterceptor = () => {
  if (typeof window === 'undefined') return;

  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError(...args);
    
    const safeStringify = (obj: any) => {
      try {
        if (obj instanceof HTMLElement) {
          return `<${obj.tagName.toLowerCase()}${obj.id ? ` id="${obj.id}"` : ''}${obj.className ? ` class="${obj.className}"` : ''}>`;
        }
        if (obj instanceof Error) {
          return obj.stack || obj.message;
        }
        const cache = new Set();
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (value instanceof HTMLElement) {
              return `<${value.tagName.toLowerCase()}>`;
            }
            if (cache.has(value)) {
              return '[Circular]';
            }
            cache.add(value);
          }
          return value;
        });
      } catch (e) {
        return String(obj);
      }
    };

    const msg = args.map(a => typeof a === 'object' ? safeStringify(a) : String(a)).join(' ');
    // Ignore some React dev errors
    if (!msg.includes('Warning: React does not recognize') && !msg.includes('Warning: Invalid DOM property')) {
      errorStore.addError(msg, 'console.error');
    }
  };

  window.addEventListener('error', (event) => {
    errorStore.addError(event.message || 'Unknown Error', event.filename || 'window.onerror');
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorStore.addError(event.reason?.message || String(event.reason) || 'Unhandled Promise Rejection', 'unhandledrejection');
  });
};
