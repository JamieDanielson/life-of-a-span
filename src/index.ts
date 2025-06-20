import "./tracing";
import { setTimeout } from 'node:timers/promises';
import express, { Request, Response } from 'express';
import { trace } from '@opentelemetry/api';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/hello', async (req: Request, res: Response) => {
  // Get the tracer to create spans
  const tracer = trace.getTracer("spanley-tracer");

  // Start a new span for picking up clues
  // The new span gets set in context and this context is activated
  // for the duration of the function call.
  await tracer.startActiveSpan("spanley-picking-up-clues", async (span) => {
    // Set attributes (clues) on the span
    span.setAttributes({ "app.distraction": "squirrel" });
    try {
        await setTimeout(1000); // Simulate some async work
        span.addEvent("spanley saw a squirrel");
        res.send('hello from spanley!');
        span.end();
    } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: 'oh noes! something went wrong' });
        res.status(500).send('oh noes! something went wrong');
        span.end();
    }
  });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
