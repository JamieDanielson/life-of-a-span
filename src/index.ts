import "./tracing";
import { setTimeout } from 'node:timers/promises';
import express, { Request, Response } from 'express';
import { trace, Span } from '@opentelemetry/api';

const app = express();
const PORT = process.env.PORT || 3000;

// Relay race participants
const teams = [
  { name: "Spanley", team: "Sierra", color: "blue" },
  { name: "Spandrew", team: "Papa", color: "red" },
  { name: "Spandora", team: "Alpha", color: "green" },
  { name: "Spannika", team: "November", color: "yellow" }
];

app.get('/relay-race', async (req: Request, res: Response) => {
  const tracer = trace.getTracer("relay-race-tracer");

  try {
    // Start all 4 relay teams simultaneously
    const racePromises = teams.map((team, teamIndex) =>
      runRelayTeam(tracer, team, teamIndex)
    );

    const results = await Promise.all(racePromises);
    const winner = results.reduce((prev, current) =>
      (prev.totalTime < current.totalTime) ? prev : current
    );

    trace.getActiveSpan()?.addEvent("Relay race completed");
    trace.getActiveSpan()?.setAttributes({
      "race.winner": winner.team,
      "race.winner.leader": winner.leader,
      "race.winner.time": winner.totalTime
    });

    res.json({
      message: "Relay race completed!",
      results: results,
      winner: `The trophy goes to: ${winner.team} (${winner.leader}) with a time of ${winner.totalTime}ms!`
    });
  } catch (error) {
    res.status(500).json({ error: "Race encountered an error!" });
  }
});

async function runRelayTeam(tracer: any, teamLeader: any, teamIndex: number) {
  return tracer.startActiveSpan(`team-${teamLeader.team.toLowerCase()}-starts-race`, async (teamSpan: Span) => {
    // Set attributes describing each team
    teamSpan.setAttributes({
      "team.name": teamLeader.team, // Sierra
      "team.leader": teamLeader.name, // Spanley
      "team.color": teamLeader.color, // blue
    });

    try {
      const runners = [
        `${teamLeader.name.toLowerCase()}-runner-1`,
        `${teamLeader.name.toLowerCase()}-runner-2`,
        `${teamLeader.name.toLowerCase()}-runner-3`,
        `${teamLeader.name.toLowerCase()}-runner-4`
      ];

      let totalTime = 0;

      // Each runner runs their leg of the race
      for (let i = 0; i < runners.length; i++) {
        const legTime = await tracer.startActiveSpan(`${runners[i]}`, async (runnerSpan: Span) => {
          runnerSpan.setAttributes({
            "runner.name": runners[i],
            "runner.leg": i + 1,
            "runner.team": teamLeader.team,
            "baton.received": i > 0 ? "yes" : "starting"
          });

          const legTime = Math.floor(Math.random() * 600) + 200;
          await setTimeout(legTime);

          runnerSpan.addEvent(`${runners[i]} completed leg ${i + 1}`);

          if (i < runners.length - 1) {
            runnerSpan.addEvent(`Baton passed to ${runners[i + 1]}`);
            runnerSpan.setAttributes({ "baton.passed": "yes" });
          } else {
            runnerSpan.addEvent(`${teamLeader.team} finished the race!`);
            runnerSpan.setAttributes({ "race.finished": "yes" });
          }

          runnerSpan.end();
          return legTime;
        });

        totalTime += legTime;
      }

      teamSpan.setAttributes({
        "race.total_time_ms": totalTime,
        "race.status": "completed"
      });
      teamSpan.addEvent(`${teamLeader.team} completed relay in ${totalTime}ms`);
      teamSpan.end();

      return {
        team: teamLeader.team,
        leader: teamLeader.name,
        totalTime: totalTime,
        status: "completed"
      };

    } catch (error) {
      teamSpan.recordException(error as Error);
      teamSpan.setStatus({ code: 2, message: 'Team encountered an error during the race' });
      teamSpan.end();
      throw error;
    }
  });
}

app.get('/', async (req: Request, res: Response) => {
  res.send('Welcome to the Relay Race! Visit /relay-race to start the competition.');
});

app.listen(PORT, () => {
    console.log(`Relay Race Server is running on http://localhost:${PORT}`);
    console.log(`Visit http://localhost:${PORT}/relay-race to start the race!`);
});
