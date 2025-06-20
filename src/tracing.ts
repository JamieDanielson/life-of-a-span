import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// for debugging purposes, set the diagnostic logger
// to log debug messages to the console
// this is optional and can be removed in production
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// by default, NodeSDK sets up an OTLP Traces Exporter
// with http/protobuf protocol
// with a BatchSpanProcessor
// with an endpoint of http://localhost:4318/v1/traces
const sdk = new NodeSDK({
    serviceName: 'life-of-a-span',
    instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

console.log("Started OpenTelemetry SDK");

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
