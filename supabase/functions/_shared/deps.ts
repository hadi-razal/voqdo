import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * Real implementations of the handler dependencies, backed by the project's
 * service-role client. Only Edge Functions import this file.
 */
export function supabaseDeps() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) throw new Error('Supabase environment is missing.');

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const must = <T>({ data, error }: { data: T; error: unknown }) => {
    if (error) throw error;
    return data;
  };

  return {
    env: (name: string) => Deno.env.get(name),

    async authenticate(req: Request) {
      const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
      if (!token) return null;
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) return null;
      return { id: data.user.id, email: data.user.email ?? null, isAnonymous: !!data.user.is_anonymous };
    },

    async hasAccess(userId: string) {
      return must(await admin.rpc('access_for', { p_user: userId })) === true;
    },

    async consumeQuota(userId: string, kind: string, perMinute: number, perDay: number) {
      return (
        must(
          await admin.rpc('consume_ai_quota', {
            p_user: userId,
            p_kind: kind,
            p_per_minute: perMinute,
            p_per_day: perDay,
          })
        ) === true
      );
    },

    async upsertSubscription(row: {
      userId: string;
      status: string;
      subscriptionId: string | null;
      customerId: string | null;
      paymentId: string | null;
      currentPeriodEnd: string | null;
      eventAt: string | null;
    }) {
      return (
        must(
          await admin.rpc('upsert_subscription', {
            p_user: row.userId,
            p_status: row.status,
            p_subscription_id: row.subscriptionId,
            p_customer_id: row.customerId,
            p_payment_id: row.paymentId,
            p_period_end: row.currentPeriodEnd,
            p_event_at: row.eventAt,
          })
        ) === true
      );
    },

    async subscriptionOwner(subscriptionId: string) {
      const data = must(
        await admin.from('subscriptions').select('user_id').eq('dodo_subscription_id', subscriptionId).maybeSingle()
      );
      return (data?.user_id as string | undefined) ?? null;
    },

    async customerIdFor(userId: string) {
      const data = must(
        await admin.from('subscriptions').select('dodo_customer_id').eq('user_id', userId).maybeSingle()
      );
      return (data?.dodo_customer_id as string | undefined) ?? null;
    },

    async webhookSeen(id: string) {
      const data = must(await admin.from('webhook_events').select('id').eq('id', id).maybeSingle());
      return !!data;
    },

    async recordWebhook(id: string, type: string) {
      must(await admin.from('webhook_events').upsert({ id, type }, { onConflict: 'id', ignoreDuplicates: true }));
    },

    async deleteUser(userId: string) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
  };
}
