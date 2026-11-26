import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { AdminScreen, Badge, confirm, Empty, ErrorBox, notify, SmallAction } from '@/components/admin-ui';
import { Card, Chip, T } from '@/components/ui';
import { shortDate } from '@/lib/admin';
import { useAuth } from '@/lib/auth';
import { money } from '@/lib/listings';
import { supabase } from '@/lib/supabase';
import { methodLabel } from '@/lib/wallet';
import { colors } from '@/theme';

type W = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  amount: number;
  currency: string;
  payout_method: string;
  phone_number: string | null;
  details: { iban?: string; email?: string; account_name?: string; admin_note?: string } | null;
  status: string;
  created_at: string;
};

const filters = [
  ['pending', 'À payer'],
  ['completed', 'Payés'],
  ['failed', 'Refusés'],
  ['', 'Tous'],
] as const;

function ask(question: string): string | null {
  if (Platform.OS === 'web') return window.prompt(question) ?? null;
  return '';
}

export default function AdminWithdrawals() {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState<string>('pending');
  const [items, setItems] = useState<W[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const { data, error: e } = await supabase.rpc('admin_list_withdrawals', { p_status: status });
    if (e) setError(e.message);
    else setItems(((data ?? []) as W[]).map((w) => ({ ...w, amount: Number(w.amount) })));
  }, [status]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function process(w: W, paid: boolean) {
    const ok = await confirm(
      paid ? 'Marquer comme payé ?' : 'Refuser ce retrait ?',
      paid
        ? `Confirmez seulement après avoir envoyé ${money(w.amount, w.currency)} via ${methodLabel(w.payout_method)}.`
        : `${money(w.amount, w.currency)} sera remis sur le portefeuille de ${w.full_name ?? 'l’utilisateur'}.`,
    );
    if (!ok) return;
    const extra = ask(paid ? 'Référence du virement (facultatif)' : 'Motif du refus (facultatif)') || null;
    const { error: e } = await supabase.rpc('admin_process_withdrawal', {
      p_id: w.id,
      p_paid: paid,
      p_reference: paid ? extra : null,
      p_note: paid ? null : extra,
    });
    if (e) notify(e.message);
    load();
  }

  const dest = (w: W) =>
    w.payout_method === 'bank_transfer' ? `${w.details?.account_name ?? ''} · ${w.details?.iban ?? ''}` : w.payout_method === 'interac' ? w.details?.email ?? '' : w.phone_number ?? '';

  return (
    <AdminScreen title="Retraits" onRefresh={load}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {filters.map(([k, l]) => (
          <Chip key={k} label={l} active={status === k} onPress={() => setStatus(k)} />
        ))}
      </View>
      {!!error && <ErrorBox text={error} />}
      {items?.length === 0 && <Empty icon="wallet-outline" text="Aucune demande." />}
      {items?.map((w) => (
        <Card key={w.id} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T v="h3" color={colors.goldBright} style={{ flex: 1 }}>
              {money(w.amount, w.currency)}
            </T>
            <Badge
              label={w.status === 'pending' ? 'À payer' : w.status === 'completed' ? 'Payé' : w.status === 'failed' ? 'Refusé' : 'Annulé'}
              tone={w.status === 'pending' ? 'warning' : w.status === 'completed' ? 'success' : 'muted'}
            />
          </View>
          <T v="small">
            {w.full_name ?? 'Utilisateur'} · {w.email}
          </T>
          <Pressable
            onPress={async () => {
              await Clipboard.setStringAsync(dest(w).replace(/^ · /, ''));
              notify('Coordonnées copiées.');
            }}>
            <T v="small" color={colors.textMuted}>
              {methodLabel(w.payout_method)} : <T v="small" color={colors.text}>{dest(w)}</T> (toucher pour copier)
            </T>
          </Pressable>
          <T v="caption" color={colors.textFaint}>
            Demandé le {shortDate(w.created_at)}
            {w.details?.admin_note ? ` · ${w.details.admin_note}` : ''}
          </T>
          {w.status === 'pending' && (
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <SmallAction label="Refuser" icon="close" tone="danger" onPress={() => process(w, false)} />
              <SmallAction label="Marquer payé" icon="checkmark" onPress={() => process(w, true)} />
            </View>
          )}
        </Card>
      ))}
    </AdminScreen>
  );
}
