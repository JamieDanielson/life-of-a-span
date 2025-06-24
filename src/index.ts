import "./tracing";
import { setTimeout } from 'node:timers/promises';
import express, { Request, Response } from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send(`
    <h1>The Life of a Span - Meet Spanley!</h1>
    <p>Visit <a href="/spanley">/spanley</a> to follow Spanley's journey from birth to visualization.</p>
    <p>This demo shows the complete lifecycle of an OpenTelemetry span:</p>
    <ol>
      <li><strong>Birth of a Span</strong> - Spanley is born with a Trace ID, Span ID, and purpose!</li>
      <li><strong>Growing Up</strong> - Spanley journals his experiences through attributes and events</li>
      <li><strong>Making Friends</strong> - Spanley meets other spans through context propagation</li>
      <li><strong>Journaled Memories</strong> - Spans are collected by the BatchSpanProcessor</li>
      <li><strong>Leaving Home</strong> - The OTLP Exporter sends Spanley to the backend</li>
      <li><strong>Spanley's Legacy</strong> - Spanley appears in your observability tool!</li>
    </ol>
  `);
});

app.get('/spanley', async (req: Request, res: Response) => {
  const tracer = trace.getTracer("spanley-tracer");
  await tracer.startActiveSpan("spanley-life-journey", async (rootSpan) => {
    try {
      rootSpan.addEvent("Spanley's journey begins!");

      await tracer.startActiveSpan("spanley-birth-phase", async (birthSpan) => {
        birthSpan.setAttributes({
          "spanley.birth.location": "code",
          "spanley.purpose": "observability",
          "journey.phase": "birth"
        });
        birthSpan.addEvent("Spanley is born!");
        await setTimeout(200);
        birthSpan.end();
      });

      await tracer.startActiveSpan("spanley-growing-up-phase", async (growingUpSpan) => {
        growingUpSpan.setAttributes({
          "journey.phase": "growing-up",
          "spanley.weather": "sunny",
          "spanley.mood": "happy"
        });
        growingUpSpan.addEvent("Spanley begins to grow");
        await setTimeout(300);

      await tracer.startActiveSpan("spanley-learning-skills", async (learningSpan) => {
        learningSpan.setAttributes({
          "skill.type": "attributes",
          "skill.level": "beginner"
        });
        learningSpan.addEvent("Spanley learned about attributes");
        await setTimeout(200);

        // Sometimes Spanley makes mistakes while learning
        try {
          learningSpan.addEvent("Spanley attempts error handling");
          throw new Error("Controlled learning error");
        } catch (e) {
          learningSpan.recordException(e as Error);
          learningSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Spanley recovered from a learning mistake"
          });
        }

        learningSpan.setAttributes({
          "skill.level": "intermediate"
        });
        learningSpan.end();
      });
      growingUpSpan.end();
   });

      await tracer.startActiveSpan("spanley-making-friends-phase", async (friendsSpan) => {
        friendsSpan.setAttributes({
          "journey.phase": "making-friends",
          "spanley.location": "playground"
        });
        friendsSpan.addEvent("Spanley starts making friends");

        const friendNames = ["Tracey", "Spandrew", "Olly"];
      for (const friendName of friendNames) {
        await tracer.startActiveSpan(`meeting-${friendName.toLowerCase()}`, async (friendSpan) => {
          friendSpan.setAttributes({
            "friend.name": friendName,
            "friendship.status": "new"
          });
          friendSpan.addEvent(`Spanley says hello to ${friendName}`);
          await setTimeout(150);
          friendSpan.end();
        });
      }
      friendsSpan.end();
    });

      await tracer.startActiveSpan("spanley-legacy-phase", async (legacySpan) => {
        legacySpan.setAttributes({
          "journey.phase": "legacy"
        });
        legacySpan.addEvent("Spanley's journey is complete", {
          "wisdom_gained": "true",
          "legacy": "visibility"
        });
        legacySpan.end();
      });

      res.send(`
        <h1>Spanley's Journey is Complete!</h1>

        <h2>What Just Happened?</h2>
        <ol>
          <li><strong>Birth of a Span:</strong> Spanley was born with a unique Trace ID and Span ID</li>
          <li><strong>Growing Up:</strong> Spanley recorded attributes and events about his experiences</li>
          <li><strong>Making Friends:</strong> Spanley created child spans and propagated context</li>
          <li><strong>Journaled Memories:</strong> The BatchSpanProcessor collected all these spans</li>
          <li><strong>Leaving Home:</strong> The OTLPExporter sent them to your backend</li>
          <li><strong>Spanley's Legacy:</strong> Now you can view Spanley's journey in your observability tool!</li>
        </ol>

        <h3>Look for a trace with the root span named "spanley-life-journey"</h3>
        <p>You'll see Spanley's complete lifecycle, including his friends and learning experiences!</p>
      `);

    } catch (error) {
      rootSpan.recordException(error as Error);
      rootSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Spanley's journey had an unexpected twist"
      });
      res.status(500).send('Something went wrong in Spanley\'s life journey.');
    } finally {
      rootSpan.end();
    }
  });
});

app.listen(PORT, () => {
  console.log(`Spanley's story begins at http://localhost:${PORT}`);
});
