import { useCallback, useRef, useState } from 'react';
import { useJournal } from '@/context/journal';
import { useToast } from '@/context/toast';
import { openCheckoutUrl, startProCheckout } from '@/lib/payments';

/** Opens Dodo's hosted checkout for VOQDO Pro, guarding against double taps. */
export function useCheckout() {
  const { settings } = useJournal();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);

  const checkout = useCallback(
    async (email?: string) => {
      if (request.current) return;
      const controller = new AbortController();
      request.current = controller;
      setBusy(true);
      try {
        const session = await startProCheckout({ name: settings.name, email: email?.trim() || undefined, signal: controller.signal });
        await openCheckoutUrl(session.checkoutUrl);
      } catch (error) {
        if (!controller.signal.aborted) toast(error instanceof Error ? error.message : 'Could not open checkout.');
      } finally {
        request.current = null;
        setBusy(false);
      }
    },
    [settings.name, toast]
  );

  return { checkout, busy };
}
