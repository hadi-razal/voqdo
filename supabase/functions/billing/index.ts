import { supabaseDeps } from '../_shared/deps.ts';
import { createBillingHandler } from '../_shared/handlers.mjs';

Deno.serve(createBillingHandler(supabaseDeps()));
