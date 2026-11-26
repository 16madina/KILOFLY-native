import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AdminScreen, Badge, confirm, Empty, ErrorBox, notify, SearchField, SmallAction } from '@/components/admin-ui';
import { Avatar, Card, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { listUsers, setBan, shortDate, type AdminUser } from '@/lib/admin';
import { colors } from '@/theme';

const initials = (n: string) =>
  n
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

export default function AdminUsers() {
  const { isAdmin, session } = useAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (q: string) => {
    setError('');
    try {
      setUsers(await listUsers(q.trim()));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [isAdmin, search, load]);

  async function toggleBan(u: AdminUser) {
    const name = u.full_name || u.email || 'cet utilisateur';
    const ok = await confirm(
      u.is_banned ? 'Réactiver le compte ?' : 'Suspendre le compte ?',
      u.is_banned
        ? `${name} pourra de nouveau se connecter. Ses annonces suspendues restent à réactiver une par une.`
        : `${name} sera déconnecté et ne pourra plus se connecter. Ses annonces et demandes actives seront retirées.`,
    );
    if (!ok) return;
    try {
      await setBan(u.id, !u.is_banned, u.is_banned ? undefined : 'Suspendu depuis le panneau admin');
      await load(search);
    } catch (e) {
      notify((e as Error).message);
    }
  }

  return (
    <AdminScreen title="Utilisateurs" onRefresh={() => load(search)}>
      <SearchField value={search} onChange={setSearch} placeholder="Nom, e-mail ou téléphone" />
      {!!error && <ErrorBox text={error} />}
      {users && (
        <T v="caption" color={colors.textMuted}>
          {users.length} compte{users.length > 1 ? 's' : ''}
        </T>
      )}
      {users?.length === 0 && <Empty icon="people-outline" text="Aucun utilisateur trouvé." />}
      {users?.map((u) => (
        <Card key={u.id} style={{ gap: 10 }}>
          <View style={styles.head}>
            <Avatar photo={u.avatar_url ? { uri: u.avatar_url } : undefined} initials={initials(u.full_name || u.email || '?')} size={44} />
            <View style={{ flex: 1 }}>
              <T v="h3" numberOfLines={1}>
                {u.full_name || 'Sans nom'}
              </T>
              <T v="small" color={colors.textMuted} numberOfLines={1}>
                {u.email || '—'}
                {u.phone ? ` · ${u.phone}` : ''}
              </T>
            </View>
          </View>
          <View style={styles.badges}>
            {u.is_admin && <Badge label="Admin" tone="gold" />}
            {u.is_banned && <Badge label="Suspendu" tone="danger" />}
            <Badge label={u.id_verified ? 'Identité vérifiée' : 'Identité non vérifiée'} tone={u.id_verified ? 'success' : 'muted'} />
            <Badge label={u.email_verified ? 'E-mail vérifié' : 'E-mail non vérifié'} tone={u.email_verified ? 'success' : 'muted'} />
          </View>
          <View style={styles.foot}>
            <T v="caption" color={colors.textFaint} style={{ flex: 1 }}>
              {[u.city, u.country].filter(Boolean).join(', ') || 'Ville inconnue'} · {u.listings_count} annonce{u.listings_count > 1 ? 's' : ''} · inscrit le {shortDate(u.created_at)}
            </T>
            {!u.is_admin && u.id !== session?.user.id && (
              <SmallAction
                label={u.is_banned ? 'Réactiver' : 'Suspendre'}
                icon={u.is_banned ? 'refresh' : 'ban'}
                tone={u.is_banned ? 'gold' : 'danger'}
                onPress={() => toggleBan(u)}
              />
            )}
          </View>
        </Card>
      ))}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
