'use strict';

if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  return;
}

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-grpc');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { logs, SeverityNumber } = require('@opentelemetry/api-logs');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),
  logRecordProcessors: [new BatchLogRecordProcessor(new OTLPLogExporter())],
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },
    '@opentelemetry/instrumentation-dns': { enabled: false },
  })],
});

sdk.start();

if (process.env.OTEL_LOG_LEVEL) {
  const level = {
    none: DiagLogLevel.NONE,
    error: DiagLogLevel.ERROR,
    warn: DiagLogLevel.WARN,
    info: DiagLogLevel.INFO,
    debug: DiagLogLevel.DEBUG,
  }[process.env.OTEL_LOG_LEVEL.toLowerCase()] ?? DiagLogLevel.INFO;
  diag.setLogger(new DiagConsoleLogger(), level);
}

// Bridge console.* to OTel logs so existing console.log/error calls appear as
// structured logs in the Aspire dashboard, correlated with the active trace.
const otelLogger = logs.getLogger('console-bridge');
const stringify = (v) => {
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
};
const formatArgs = (args) => args.map(stringify).join(' ');

const bridge = (original, severityNumber, severityText) => (...args) => {
  otelLogger.emit({ severityNumber, severityText, body: formatArgs(args) });
  original.apply(console, args);
};

console.log = bridge(console.log, SeverityNumber.INFO, 'INFO');
console.info = bridge(console.info, SeverityNumber.INFO, 'INFO');
console.warn = bridge(console.warn, SeverityNumber.WARN, 'WARN');
console.error = bridge(console.error, SeverityNumber.ERROR, 'ERROR');
console.debug = bridge(console.debug, SeverityNumber.DEBUG, 'DEBUG');

const shutdown = () => {
  sdk.shutdown().catch((err) => console.error('OTel shutdown error', err));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
