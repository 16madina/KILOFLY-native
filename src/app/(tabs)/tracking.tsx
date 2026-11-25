import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessagesList, unreadCount } from '@/components/messages-list';
import { PackageTracking } from '@/components/package-tracking';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { AccentTitle, BrandHeader, T, tap } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, fonts, radius } from '@/theme';

type Segment = 'colis' | 'messages';

/** Suivi: two inner tabs — package tracking and messages. */
export default function Suivi() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: Segment }>();
  const { session } = useAuth();
  const [segment, setSegment] = useState<Segment>(params.tab ?? 'colis');

  useEffect(() => {
    if (params.tab) setSegment(params.tab);
  }, [params.tab]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
      <BrandHeader top={insets.top}>
        <AccentTitle before="Mon " accent="suivi" style={{ marginTop: 34 }} />
        <T v="body" color={colors.textMuted} style={{ marginTop: 6, maxWidth: 240 }}>
          Vos colis en route et vos échanges avec les voyageurs.
        </T>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
        <View style={styles.segment}>
          {(
            [
              ['colis', 'Suivi de colis', 1],
              ['messages', 'Messages', unreadCount],
            ] as [Segment, string, number][]
          ).map(([key, label, badge]) => {
            const active = segment === key;
            return (
              <Pressable key={key} onPress={() => (tap(), setSegment(key))} style={[styles.segItem, active && styles.segActive]}>
                <T v="small" color={active ? colors.text : colors.textMuted} style={{ fontFamily: fonts.semibold }}>
                  {label}
                </T>
                {badge > 0 && (
                  <View style={[styles.badge, !active && { backgroundColor: colors.cardHi }]}>
                    <T v="caption" color={active ? colors.onGold : colors.text} style={{ fontFamily: fonts.bold, fontSize: 11 }}>
                      {badge}
                    </T>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 16 }}>
          {!session ? (
            <SignInPrompt
              icon={segment === 'colis' ? 'cube-outline' : 'chatbubbles-outline'}
              text={segment === 'colis' ? 'Connectez-vous pour suivre vos colis en temps réel.' : 'Connectez-vous pour discuter avec les voyageurs.'}
            />
          ) : segment === 'colis' ? (
            <PackageTracking />
          ) : (
            <MessagesList />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgRaised,
  },
  segItem: { flex: 1, height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  segActive: { backgroundColor: colors.cardHi, borderWidth: 1, borderColor: colors.borderGold },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
});
