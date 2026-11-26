import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { Avatar, Card, T, VerifiedBadge } from '@/components/ui';
import { initialsOf } from '@/lib/auth';
import { shortDate } from '@/lib/listings';
import { useConversations } from '@/lib/messages';
import { colors, fonts } from '@/theme';

const when = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(today.getTime() - 864e5);
  if (d.toDateString() === y.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Real conversations (Suivi → Messages). */
export function MessagesList() {
  const { items } = useConversations();
  const [q, setQ] = useState('');
  const list = useMemo(
    () => (items ?? []).filter((c) => !q || norm(`${c.other_name} ${c.departure} ${c.arrival}`).includes(norm(q))),
    [items, q],
  );

  return (
    <View>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Rechercher une discussion" placeholderTextColor={colors.textMuted} style={styles.searchInput} />
      </View>

      {!items ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 30 }} />
      ) : items.length === 0 ? (
        <View style={{ alignItems: 'center', gap: 10, marginTop: 40, paddingHorizontal: 20 }}>
          <Ionicons name="chatbubbles-outline" size={36} color={colors.textFaint} />
          <T v="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
            Aucune discussion pour l’instant. Ouvrez une annonce et touchez « Écrire au voyageur » pour commencer.
          </T>
        </View>
      ) : (
        <View style={{ gap: 10, marginTop: 14 }}>
          {list.map((c) => (
            <Card key={c.id} style={styles.row} onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: c.id } })}>
              <Avatar photo={c.other_avatar ? { uri: c.other_avatar } : undefined} initials={initialsOf(c.other_name ?? '?')} size={54} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <T v="h3" style={{ fontFamily: fonts.serif, fontSize: 17, flexShrink: 1 }} numberOfLines={1}>
                    {c.other_name || 'Utilisateur'}
                  </T>
                  {c.other_verified && <VerifiedBadge size={15} />}
                  <View style={{ flex: 1 }} />
                  <T v="caption" color={c.unread ? colors.gold : colors.textFaint}>
                    {when(c.last_at)}
                  </T>
                </View>
                {!!c.departure && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="airplane" size={12} color={colors.gold} />
                    <T v="caption" color={colors.gold} numberOfLines={1}>
                      {c.departure} → {c.arrival} · {shortDate(c.departure_date)}
                    </T>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <T
                    v="small"
                    color={c.unread ? colors.text : colors.textMuted}
                    style={[{ flex: 1 }, c.unread ? { fontFamily: fonts.medium } : null]}
                    numberOfLines={1}>
                    {c.blocked ? 'Discussion bloquée' : c.last_message ? `${c.last_from_me ? 'Vous : ' : ''}${c.last_message}` : 'Nouvelle discussion'}
                  </T>
                  {c.unread > 0 && (
                    <View style={styles.unread}>
                      <T v="caption" color={colors.onGold} style={{ fontFamily: fonts.bold }}>
                        {c.unread}
                      </T>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  unread: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
