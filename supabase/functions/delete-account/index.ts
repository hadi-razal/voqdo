import { supabaseDeps } from '../_shared/deps.ts';
import { createDeleteAccountHandler } from '../_shared/handlers.mjs';

Deno.serve(createDeleteAccountHandler(supabaseDeps()));
