import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AdminScreen, ErrorBox, notify, SmallAction } from '@/components/admin-ui';
import { Card, T, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { getStats, money, recentActions, testPush, shortDate, type AdminAction, type AdminStats } from '@/lib/admin';
import { colors } from '@/theme';

const sections: { icon: IconName; title: string; sub: string; href: Href }[] = [
  { icon: 'people-outline', title: 'Utilisateurs', sub: 'Rechercher, suspendre ou réactiver un compte', href: '/admin/users' },
  { icon: 'airplane-outline', title: 'Annonces', sub: 'Modérer les voyages publiés', href: '/admin/listings' },
  { icon: 'shield-checkmark-outline', title: 'Vérification d’identité', sub: 'Valider les pièces d’identité envoyées', href: '/admin/verification' },
  { icon: 'wallet-outline', title: 'Retraits', sub: 'Demandes de retrait à payer', href: '/admin/withdrawals' },
  { icon: 'card-outline', title: 'Transactions', sub: 'Paiements, commissions et revenus', href: '/admin/transactions' },
];

const actionLabels: Record<string, string> = {
  ban: 'a suspendu',
  unban: 'a réactivé',
  listing_suspend: 'a suspendu une annonce de',
  listing_reactivate: 'a réactivé une annonce de',
  id_approve: 'a vérifié l’identité de',
  withdrawal_paid: 'a payé un retrait de',
  withdrawal_refused: 'a refusé un retrait de',
  id_reject: 'a refusé l’identité de',
};

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [s, a] = await Promise.all([getStats(), recentActions()]);
      setStats(s);
      setActions(a);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const revenue = stats ? Object.entries(stats.revenue) : [];
  const volume = stats ? Object.entries(stats.volume) : [];

  return (
    <AdminScreen title="Tableau de bord" onRefresh={load}>
      {!!error && <ErrorBox text={error} />}

      <View style={styles.grid}>
        <Stat icon="people" label="Utilisateurs" value={stats?.users} hint={stats ? `+${stats.users_7d} cette semaine` : undefined} />
        <Stat icon="airplane" label="Annonces actives" value={stats?.listings_active} hint={stats ? `${stats.requests_active} demandes de colis` : undefined} />
        <Stat icon="time" label="Réservations en attente" value={stats?.reservations_pending} />
        <Stat icon="checkmark-done" label="Paiements reçus" value={stats?.tx_paid} />
        <Stat icon="ban" label="Comptes suspendus" value={stats?.banned} tone={stats?.banned ? 'danger' : undefined} />
        <Stat
          icon="flag"
          label="Signalements / identités"
          value={stats ? `${stats.reports_pending} / ${stats.id_pending}` : undefined}
          hint="en attente"
          tone={stats && stats.reports_pending + stats.id_pending > 0 ? 'warning' : undefined}
        />
      </View>

      <Card gold>
        <T v="label" color={colors.gold}>
          Revenus KiloFly (commissions)
        </T>
        <View style={{ marginTop: 8, gap: 2 }}>
          {revenue.length === 0 ? (
            <T v="h2">{money(0)}</T>
          ) : (
            revenue.map(([c, v]) => (
              <T key={c} v="h2" color={colors.goldBright}>
                {money(v, c)}
              </T>
            ))
          )}
        </View>
        <T v="small" color={colors.textMuted} style={{ marginTop: 6 }}>
          Volume encaissé : {volume.length === 0 ? money(0) : volume.map(([c, v]) => money(v, c)).join(' · ')}
        </T>
      </Card>

      <View style={{ gap: 10 }}>
        {sections.map((s) => (
          <Card key={s.title} onPress={() => router.push(s.href)} style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name={s.icon} size={22} color={colors.goldBright} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="h3">{s.title}</T>
              <T v="small" color={colors.textMuted}>
                {s.sub}
              </T>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </Card>
        ))}
      </View>

      <Card style={styles.row}>
        <View style={styles.rowIcon}>
          <Ionicons name="notifications-outline" size={22} color={colors.goldBright} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="h3">Notifications push</T>
          <T v="small" color={colors.textMuted}>
            Envoie une notification test sur vos téléphones
          </T>
        </View>
        <SmallAction
          label="Tester"
          icon="paper-plane-outline"
          onPress={async () => {
            try {
              const n = await testPush();
              notify(
                n > 0
                  ? `Notification envoyée sur ${n} téléphone${n > 1 ? 's' : ''}.`
                  : "Aucun téléphone enregistré : ouvrez l'app KiloFly sur votre téléphone, connectez-vous et acceptez les notifications.",
              );
            } catch (e) {
              notify((e as Error).message);
            }
          }}
        />
      </Card>

      <T v="label" color={colors.textMuted} style={{ marginTop: 10 }}>
        Dernières actions admin
      </T>
      <Card>
        {actions.length === 0 ? (
          <T v="small" color={colors.textMuted}>
            Aucune action pour l'instant.
          </T>
        ) : (
          actions.map((a, i) => (
            <View key={i} style={[styles.action, i > 0 && styles.sep]}>
              <T v="small">
                <T v="small" color={colors.goldBright}>
                  {a.admin_name || 'Admin'}
                </T>{' '}
                {actionLabels[a.action_type] ?? a.action_type} <T v="small" style={{ fontWeight: '600' }}>{a.target_name || '—'}</T>
              </T>
              <T v="caption" color={colors.textFaint}>
                {shortDate(a.created_at)}
                {a.details && !a.details.startsWith('listing ') ? ` · ${a.details}` : ''}
              </T>
            </View>
          ))
        )}
      </Card>
    </AdminScreen>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: IconName;
  label: string;
  value?: number | string;
  hint?: string;
  tone?: 'danger' | 'warning';
}) {
  const accent = tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : colors.goldBright;
  return (
    <Card style={styles.stat}>
      <Ionicons name={icon} size={18} color={accent} />
      <T v="h2" color={accent} style={{ marginTop: 6 }}>
        {value ?? '…'}
      </T>
      <T v="caption" color={colors.textMuted}>
        {label}
      </T>
      {hint && (
        <T v="caption" color={colors.textFaint} style={{ fontSize: 11 }}>
          {hint}
        </T>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { flexBasis: '47%', flexGrow: 1, minHeight: 112 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  action: { paddingVertical: 8, gap: 2 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
