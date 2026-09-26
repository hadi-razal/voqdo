import { supabaseDeps } from '../_shared/deps.ts';
import { createAiHandler } from '../_shared/handlers.mjs';

Deno.serve(createAiHandler(supabaseDeps()));
