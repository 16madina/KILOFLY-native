import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, FlightProgress, GoldPill, T, VerifiedBadge } from '@/components/ui';
import { cityCodes, cityImages, shortName, trackedPackage as p } from '@/data/mock';
import { colors, fonts, radius } from '@/theme';

/** Active package: flight card, traveler, step timeline, hand-over code. */
export function PackageTracking() {
  const progress = p.currentStep / (p.steps.length - 1);
  return (
    <View style={{ gap: 14 }}>
      <Card gold style={{ padding: 0 }}>
        <Image source={cityImages[p.to]} style={[StyleSheet.absoluteFill, { opacity: 0.3 }]} contentFit="cover" />
        <LinearGradient colors={['rgba(17,30,46,0.75)', 'rgba(17,30,46,0.95)']} style={StyleSheet.absoluteFill} />
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T v="label" color={colors.gold}>
              Colis {p.id}
            </T>
            <GoldPill label="En vol" />
          </View>
          <View style={styles.codes}>
            <View>
              <T v="display">{cityCodes[p.from]}</T>
              <T v="small" color={colors.textMuted}>
                {p.from}
              </T>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <T v="display">{cityCodes[p.to]}</T>
              <T v="small" color={colors.textMuted}>
                {p.to}
              </T>
            </View>
          </View>
          <FlightProgress progress={progress} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <T v="caption" color={colors.textMuted}>
              Départ 10:35
            </T>
            <T v="caption" color={colors.gold} style={{ fontFamily: fonts.semibold }}>
              Arrivée prévue 15:10
            </T>
          </View>
          <T v="small" color={colors.textMuted} style={{ marginTop: 10 }}>
            {p.item} · {p.kg} kg
          </T>
        </View>
      </Card>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar photo={p.traveler.photo} initials={p.traveler.initials} size={52} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <T v="h2" style={{ fontSize: 19, flexShrink: 1 }} numberOfLines={1}>
              {shortName(p.traveler.name)}
            </T>
            <VerifiedBadge size={17} />
          </View>
          <T v="small" color={colors.textMuted}>
            Transporte votre colis
          </T>
        </View>
        <Button title="Écrire" small variant="outline" leftIcon="chatbubble-outline" onPress={() => router.push('/conversation/c1')} />
      </Card>

      <Card>
        <T v="h2" style={{ marginBottom: 16 }}>
          Étapes
        </T>
        {p.steps.map((s, i) => {
          const done = i < p.currentStep;
          const current = i === p.currentStep;
          const last = i === p.steps.length - 1;
          return (
            <View key={s.label} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ alignItems: 'center', width: 28 }}>
                <View style={[styles.node, done && styles.nodeDone, current && styles.nodeCurrent]}>
                  {done && <Ionicons name="checkmark" size={15} color={colors.onGold} />}
                  {current && <Ionicons name="airplane" size={14} color={colors.onGold} />}
                </View>
                {!last && <View style={[styles.connector, done && { backgroundColor: colors.gold }]} />}
              </View>
              <View style={{ flex: 1, paddingBottom: last ? 0 : 22 }}>
                <T v="bodyStrong" color={done || current ? colors.text : colors.textFaint}>
                  {s.label}
                </T>
                <T v="small" color={colors.textMuted}>
                  {s.detail}
                </T>
                <T v="caption" color={current ? colors.gold : colors.textFaint} style={{ marginTop: 2 }}>
                  {s.time}
                </T>
              </View>
            </View>
          );
        })}
      </Card>

      <View style={styles.code}>
        <Ionicons name="key-outline" size={22} color={colors.gold} />
        <View style={{ flex: 1 }}>
          <T v="bodyStrong">Code de remise : 4 7 2 9</T>
          <T v="small" color={colors.textMuted}>
            À donner au voyageur uniquement à la réception du colis.
          </T>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  codes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  nodeCurrent: { backgroundColor: colors.goldBright, borderColor: colors.goldBright },
  connector: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  code: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.goldSoft,
  },
});
