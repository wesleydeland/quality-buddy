import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Aspire injects OTEL_EXPORTER_OTLP_ENDPOINT (gRPC) and
// OTEL_EXPORTER_OTLP_HEADERS (api key) into the Vite process. The browser
// can only speak HTTP OTLP, so we use the HTTP endpoint URL set on the
// apphost via ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL (falls back to the
// gRPC URL, which won't work but lets the app boot outside Aspire).
const httpBase = (process.env.ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL
  || process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  || '').replace(/\/$/, '');
const otelConfig = {
  tracesEndpoint: httpBase ? `${httpBase}/v1/traces` : '',
  metricsEndpoint: httpBase ? `${httpBase}/v1/metrics` : '',
  headers: process.env.OTEL_EXPORTER_OTLP_HEADERS || '',
  serviceName: process.env.OTEL_SERVICE_NAME || 'web',
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'otel-browser-config',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          const serialized = JSON.stringify(otelConfig).replace(/</g, '\\u003c');
          return html.replace(
            '<head>',
            `<head><script>window.__OTEL_CONFIG__=${serialized};</script>`,
          );
        },
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': process.env.VITE_API_URL || 'http://localhost:3001',
    },
  },
});
