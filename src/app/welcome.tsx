import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccentTitle, art, Button, Logo, T, type IconName } from '@/components/ui';
import { colors } from '@/theme';

const perks: [IconName, string][] = [
  ['cube-outline', 'Plus\néconomique'],
  ['leaf-outline', 'Plus\nresponsable'],
  ['airplane', 'Plus\nrapide'],
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}>
      <Logo size={36} center />

      <View style={styles.art}>
        <Image source={art.window} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={['rgba(3,15,30,0)', colors.bg]} start={{ x: 0, y: 0.6 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[colors.bg, 'rgba(3,15,30,0)', 'rgba(3,15,30,0)', colors.bg]} locations={[0, 0.12, 0.88, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </View>

      <AccentTitle before={'Envoyez vos colis\navec '} accent="des voyageurs" style={{ marginTop: -8 }} />
      <T v="body" color={colors.textMuted} style={{ marginTop: 10, fontSize: 16, lineHeight: 23 }}>
        Un moyen simple, fiable et économique d’expédier vos colis grâce aux voyageurs qui se déplacent déjà.
      </T>

      <View style={styles.perks}>
        {perks.map(([icon, label], i) => (
          <View key={label} style={[styles.perk, i > 0 && styles.perkSep]}>
            <View style={styles.perkIcon}>
              <Ionicons name={icon} size={22} color={colors.gold} />
            </View>
            <T v="small" style={{ textAlign: 'center' }}>
              {label}
            </T>
          </View>
        ))}
      </View>

      <View style={{ gap: 14, marginTop: 28 }}>
        <Button title="Commencer" icon="arrow-forward" onPress={() => router.push('/onboarding')} />
        <Button title="Se connecter" leftIcon="person-outline" variant="dark" onPress={() => router.push('/auth')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  art: { height: 320, marginHorizontal: -24, marginTop: 18 },
  perks: { flexDirection: 'row', marginTop: 26 },
  perk: { flex: 1, alignItems: 'center', gap: 10 },
  perkSep: { borderLeftWidth: 1, borderLeftColor: colors.border },
  perkIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardHi,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});
