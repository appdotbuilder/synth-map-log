import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createLogEntryInputSchema,
  createNetworkActivityInputSchema,
  logQueryParamsSchema,
  networkActivityQueryParamsSchema
} from './schema';

// Import handlers
import { createLogEntry } from './handlers/create_log_entry';
import { getLogEntries } from './handlers/get_log_entries';
import { createNetworkActivity } from './handlers/create_network_activity';
import { getNetworkActivities } from './handlers/get_network_activities';
import { getNetworkActivityById } from './handlers/get_network_activity_by_id';
import {
  generateDummyLogEntries,
  generateDummyNetworkActivities,
  streamRandomLogEntry
} from './handlers/generate_dummy_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Log entry management
  createLogEntry: publicProcedure
    .input(createLogEntryInputSchema)
    .mutation(({ input }) => createLogEntry(input)),

  getLogEntries: publicProcedure
    .input(logQueryParamsSchema.optional())
    .query(({ input }) => getLogEntries(input)),

  // Network activity management
  createNetworkActivity: publicProcedure
    .input(createNetworkActivityInputSchema)
    .mutation(({ input }) => createNetworkActivity(input)),

  getNetworkActivities: publicProcedure
    .input(networkActivityQueryParamsSchema.optional())
    .query(({ input }) => getNetworkActivities(input)),

  getNetworkActivityById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ input }) => getNetworkActivityById(input.id)),

  // Dummy data generation for UI showcase
  generateDummyLogEntries: publicProcedure
    .input(z.object({ count: z.number().int().positive().optional() }))
    .mutation(({ input }) => generateDummyLogEntries(input?.count)),

  generateDummyNetworkActivities: publicProcedure
    .input(z.object({ count: z.number().int().positive().optional() }))
    .mutation(({ input }) => generateDummyNetworkActivities(input?.count)),

  // Real-time streaming endpoint for continuous log generation
  streamRandomLogEntry: publicProcedure
    .mutation(() => streamRandomLogEntry()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();