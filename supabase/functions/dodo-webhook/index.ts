import { supabaseDeps } from '../_shared/deps.ts';
import { createDodoWebhookHandler } from '../_shared/handlers.mjs';

Deno.serve(createDodoWebhookHandler(supabaseDeps()));
