import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AdminScreen, Badge, Empty, ErrorBox } from '@/components/admin-ui';
import { Card, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { listTransactions, money, shortDate, type AdminTransaction } from '@/lib/admin';
import { colors } from '@/theme';

function statusOf(t: AdminTransaction): { label: string; tone: 'success' | 'warning' | 'danger' | 'muted' } {
  if (t.status === 'refunded') return { label: 'Remboursé', tone: 'muted' };
  if (t.status === 'cancelled' || t.payment_status === 'failed') return { label: 'Échoué / annulé', tone: 'danger' };
  if (t.paid_at || t.payment_status === 'paid' || t.payment_status === 'succeeded') return { label: 'Payé', tone: 'success' };
  return { label: 'En attente', tone: 'warning' };
}

const providers: Record<string, string> = { stripe: 'Carte (Stripe)', feexpay: 'Mobile money (FeexPay)' };

export default function AdminTransactions() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<AdminTransaction[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(await listTransactions());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  return (
    <AdminScreen title="Transactions" onRefresh={load}>
      {!!error && <ErrorBox text={error} />}
      {items?.length === 0 && <Empty icon="card-outline" text="Aucune transaction pour l'instant." />}
      {items?.map((t) => {
        const s = statusOf(t);
        return (
          <Card key={t.id} style={{ gap: 6 }}>
            <View style={styles.head}>
              <T v="h3" color={colors.goldBright} style={{ flex: 1 }}>
                {money(t.amount, t.currency)}
              </T>
              <Badge label={s.label} tone={s.tone} />
            </View>
            <T v="small">
              {t.buyer_name || 'Expéditeur'} → {t.seller_name || 'Voyageur'}
            </T>
            {!!t.route && (
              <T v="small" color={colors.textMuted}>
                {t.route}
              </T>
            )}
            <T v="caption" color={colors.textFaint}>
              Commission KiloFly {money(t.platform_commission, t.currency)} · versé au voyageur {money(t.seller_amount, t.currency)}
            </T>
            <T v="caption" color={colors.textFaint}>
              {providers[t.provider ?? ''] ?? t.provider ?? '—'} · {t.paid_at ? `payé le ${shortDate(t.paid_at)}` : `créé le ${shortDate(t.created_at)}`}
            </T>
          </Card>
        );
      })}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
