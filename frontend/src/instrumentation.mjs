import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
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
    const diagLevelMap = {
      none: DiagLogLevel.NONE,
      error: DiagLogLevel.ERROR,
      warn: DiagLogLevel.WARN,
      info: DiagLogLevel.INFO,
      debug: DiagLogLevel.DEBUG,
      verbose: DiagLogLevel.VERBOSE,
      all: DiagLogLevel.ALL,
    };
    diag.setLogger(new DiagConsoleLogger(), diagLevelMap[process.env.OTEL_LOG_LEVEL.toLowerCase()] ?? DiagLogLevel.INFO);
  }

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
}
