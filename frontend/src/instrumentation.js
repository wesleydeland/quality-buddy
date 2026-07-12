// Browser-side OpenTelemetry initialization.
// MUST be imported before any other module that uses fetch/XHR so the
// auto-instrumentations can patch them before the first call.
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { PeriodicExportingMetricReader, MeterProvider } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { metrics as metricsApi } from '@opentelemetry/api';

const cfg = (typeof window !== 'undefined' && window.__OTEL_CONFIG__) || {};
const tracesUrl = cfg.tracesEndpoint || '';
const metricsUrl = cfg.metricsEndpoint || '';
const headers = {};
(cfg.headers || '').split(',').forEach((pair) => {
  const eq = pair.indexOf('=');
  if (eq > 0) {
    const k = pair.slice(0, eq).trim();
    const v = pair.slice(eq + 1).trim();
    if (k) headers[k] = v;
  }
});

if (tracesUrl) {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: cfg.serviceName || 'quality-buddy-web',
    [ATTR_SERVICE_VERSION]: '1.0.0',
  });

  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter({ url: tracesUrl, headers }))],
  });

  provider.register({
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-fetch': { enabled: true, clearTimingResources: true },
        '@opentelemetry/instrumentation-xml-http-request': { enabled: true },
        '@opentelemetry/instrumentation-document-load': { enabled: true },
        '@opentelemetry/instrumentation-user-interaction': { enabled: false },
      }),
    ],
  });

  if (metricsUrl) {
    metricsApi.setGlobalMeterProvider(new MeterProvider({
      resource,
      readers: [new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter({ url: metricsUrl, headers }) })],
    }));
  }

  // eslint-disable-next-line no-console
  console.log(`[otel-web] tracing -> ${tracesUrl}${metricsUrl ? `, metrics -> ${metricsUrl}` : ''}`);
} else {
  // eslint-disable-next-line no-console
  console.log('[otel-web] disabled (window.__OTEL_CONFIG__ missing)');
}
