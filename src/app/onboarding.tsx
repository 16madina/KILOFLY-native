import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileChoices } from '@/components/profile-choice';
import { AccentTitle, BrandHeader, IconButton, T } from '@/components/ui';
import { colors, fonts } from '@/theme';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
      <BrandHeader top={insets.top} art={false}>
        <View style={styles.navRow}>
          <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
          <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={10} style={styles.skip}>
            <T v="bodyStrong" color={colors.gold}>
              Passer
            </T>
            <Ionicons name="arrow-forward" size={16} color={colors.gold} />
          </Pressable>
        </View>
        <View style={styles.stepRow}>
          <T v="small" style={{ fontFamily: fonts.semibold }}>
            Étape 1 sur 3
          </T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
            ))}
          </View>
        </View>
        <View style={styles.track}>
          <View style={styles.fill} />
        </View>

        <AccentTitle before="Choisissez votre " accent="profil" style={{ marginTop: 24 }} />
        <T v="body" color={colors.textMuted} style={{ marginTop: 6 }}>
          Dites-nous comment vous souhaitez utiliser KiloFly pour une expérience personnalisée.
        </T>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
        <ProfileChoices onChoose={() => router.push('/auth')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  skip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: colors.textMuted },
  dotActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  track: { height: 6, borderRadius: 3, backgroundColor: '#1A2A3C', marginTop: 12 },
  fill: { width: '33%', height: '100%', borderRadius: 3, backgroundColor: colors.gold },
});
