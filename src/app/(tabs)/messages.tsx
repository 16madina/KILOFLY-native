import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentTitle, Avatar, BrandHeader, Card, T, tap, VerifiedBadge } from '@/components/ui';
import { conversations, listings } from '@/data/mock';
import { colors, fonts, radius } from '@/theme';

const tabs = ['Discussions', 'Réservations'];

export default function Messages() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <BrandHeader top={insets.top} tagline="Messagerie · Négociation sécurisée">
        <AccentTitle before="Vos " accent="messages" style={{ marginTop: 34 }} />
        <T v="body" color={colors.textMuted} style={{ marginTop: 6, maxWidth: 240 }}>
          Négociez et sécurisez vos envois avec les voyageurs.
        </T>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput placeholder="Rechercher une discussion" placeholderTextColor={colors.textMuted} style={styles.searchInput} />
        </View>

        <View style={styles.segment}>
          {tabs.map((t, i) => (
            <Pressable key={t} onPress={() => (tap(), setTab(i))} style={[styles.segItem, tab === i && styles.segActive]}>
              <T v="small" color={tab === i ? colors.text : colors.textMuted} style={{ fontFamily: fonts.semibold }}>
                {t}
              </T>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 10, marginTop: 16 }}>
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
    </ScrollView>
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
  segment: {
    flexDirection: 'row',
    marginTop: 14,
    padding: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgRaised,
  },
  segItem: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  segActive: { backgroundColor: colors.cardHi, borderWidth: 1, borderColor: colors.borderGold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  unread: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
