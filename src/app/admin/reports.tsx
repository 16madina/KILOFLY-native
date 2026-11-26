import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { AdminScreen, Badge, confirm, Empty, ErrorBox, notify, SmallAction } from '@/components/admin-ui';
import { REPORT_REASONS } from '@/components/report-sheet';
import { Card, Chip, T } from '@/components/ui';
import { shortDate } from '@/lib/admin';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

type Report = {
  id: string;
  created_at: string;
  status: string;
  reason: string;
  description: string | null;
  admin_note: string | null;
  reporter_id: string;
  reporter_name: string | null;
  reported_id: string;
  reported_name: string | null;
  reported_banned: boolean;
  reports_against: number;
  listing_id: string | null;
  listing_route: string | null;
  listing_status: string | null;
  conversation_id: string | null;
  last_messages: { from: string; text: string; at: string }[] | null;
};

const reasonLabel = (k: string) => REPORT_REASONS.find(([r]) => r === k)?.[1] ?? k;
const filters = [
  ['pending', 'À traiter'],
  ['resolved', 'Traités'],
  ['dismissed', 'Classés'],
  ['', 'Tous'],
] as const;

const ask = (q: string) => (Platform.OS === 'web' ? window.prompt(q) ?? '' : '');

export default function AdminReports() {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState<string>('pending');
  const [items, setItems] = useState<Report[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const { data, error: e } = await supabase.rpc('admin_list_reports', { p_status: status });
    if (e) setError(e.message);
    else setItems(((data ?? []) as Report[]).map((r) => ({ ...r, reports_against: Number(r.reports_against) })));
  }, [status]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function act(r: Report, action: 'dismiss' | 'warn' | 'suspend_listing' | 'ban') {
    const labels = {
      dismiss: ['Classer sans suite ?', 'Aucune mesure ne sera prise.'],
      warn: ['Envoyer un avertissement ?', `${r.reported_name ?? 'L’utilisateur'} recevra une notification d’avertissement.`],
      suspend_listing: ['Suspendre l’annonce ?', `${r.listing_route ?? ''} n’apparaîtra plus dans la recherche.`],
      ban: ['Suspendre le compte ?', `${r.reported_name ?? 'L’utilisateur'} ne pourra plus se connecter et ses annonces seront retirées.`],
    } as const;
    if (!(await confirm(labels[action][0], labels[action][1]))) return;
    const note = action === 'dismiss' ? '' : ask('Note (facultatif)');
    const { error: e } = await supabase.rpc('admin_resolve_report', { p_report_id: r.id, p_action: action, p_note: note || null });
    if (e) notify(e.message);
    load();
  }

  return (
    <AdminScreen title="Signalements" onRefresh={load}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {filters.map(([k, l]) => (
          <Chip key={k} label={l} active={status === k} onPress={() => setStatus(k)} />
        ))}
      </View>
      {!!error && <ErrorBox text={error} />}
      {items?.length === 0 && <Empty icon="flag-outline" text="Aucun signalement." />}
      {items?.map((r) => (
        <Card key={r.id} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T v="h3" style={{ flex: 1 }}>
              {reasonLabel(r.reason)}
            </T>
            <Badge label={r.status === 'pending' ? 'À traiter' : r.status === 'resolved' ? 'Traité' : 'Classé'} tone={r.status === 'pending' ? 'warning' : 'muted'} />
          </View>
          <T v="small">
            <T v="small" color={colors.textMuted}>
              Signalé :{' '}
            </T>
            <T v="small" color={colors.goldBright} onPress={() => router.push({ pathname: '/user/[id]', params: { id: r.reported_id } })}>
              {r.reported_name ?? 'Utilisateur'}
            </T>
            {r.reported_banned ? '  · compte suspendu' : ''}
            {r.reports_against > 1 ? `  · ${r.reports_against} personnes l’ont signalé` : ''}
          </T>
          <T v="caption" color={colors.textMuted}>
            Par {r.reporter_name ?? 'un utilisateur'} · le {shortDate(r.created_at)}
            {r.listing_route ? ` · annonce ${r.listing_route}${r.listing_status !== 'active' ? ' (inactive)' : ''}` : ''}
          </T>
          {!!r.description && <T v="small">« {r.description} »</T>}
          {!!r.last_messages?.length && (
            <View style={{ gap: 4, padding: 10, borderRadius: 10, backgroundColor: colors.field }}>
              <T v="caption" color={colors.textMuted}>
                Derniers messages de la discussion
              </T>
              {r.last_messages.map((m, i) => (
                <T key={i} v="caption" color={m.from === 'signalé' ? colors.warning : colors.textMuted}>
                  {m.from === 'signalé' ? (r.reported_name ?? 'Signalé') : (r.reporter_name ?? 'Signaleur')} : {m.text}
                </T>
              ))}
            </View>
          )}
          {!!r.admin_note && (
            <T v="caption" color={colors.textFaint}>
              Note admin : {r.admin_note}
            </T>
          )}
          {r.status === 'pending' && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <SmallAction label="Classer" icon="close" onPress={() => act(r, 'dismiss')} />
              <SmallAction label="Avertir" icon="alert-circle-outline" onPress={() => act(r, 'warn')} />
              {r.listing_id && r.listing_status === 'active' && (
                <SmallAction label="Suspendre l’annonce" icon="pause" tone="danger" onPress={() => act(r, 'suspend_listing')} />
              )}
              {!r.reported_banned && <SmallAction label="Suspendre le compte" icon="ban" tone="danger" onPress={() => act(r, 'ban')} />}
            </View>
          )}
        </Card>
      ))}
    </AdminScreen>
  );
}
