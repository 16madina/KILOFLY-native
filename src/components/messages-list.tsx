import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';

import { Avatar, Card, T, VerifiedBadge } from '@/components/ui';
import { conversations, listings } from '@/data/mock';
import { colors, fonts } from '@/theme';

export const unreadCount = conversations.reduce((n, c) => n + c.unread, 0);

/** Conversations with travelers (shown in Suivi → Messages). */
export function MessagesList() {
  return (
    <View>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput placeholder="Rechercher une discussion" placeholderTextColor={colors.textMuted} style={styles.searchInput} />
      </View>

      <View style={{ gap: 10, marginTop: 14 }}>
        {conversations.map((c) => {
          const photo = listings.find((l) => l.traveler.id === c.travelerId)?.traveler.photo;
          return (
            <Card key={c.id} style={styles.row} onPress={() => router.push(`/conversation/${c.id}`)}>
              <Avatar photo={photo} initials={c.initials} size={54} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <T v="h3" style={{ fontFamily: fonts.serif, fontSize: 17, flexShrink: 1 }} numberOfLines={1}>
                    {c.name}
                  </T>
                  {c.verified && <VerifiedBadge size={15} />}
                  <View style={{ flex: 1 }} />
                  <T v="caption" color={c.unread ? colors.gold : colors.textFaint}>
                    {c.time}
                  </T>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="airplane" size={12} color={colors.gold} />
                  <T v="caption" color={colors.gold}>
                    {c.route}
                  </T>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <T
                    v="small"
                    color={c.unread ? colors.text : colors.textMuted}
                    style={[{ flex: 1 }, c.unread ? { fontFamily: fonts.medium } : null]}
                    numberOfLines={1}>
                    {c.last}
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
          );
        })}
      </View>
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
