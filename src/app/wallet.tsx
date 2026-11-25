import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, BrandHeader, Button, Card, Logo, T } from '@/components/ui';
import { me, walletTx } from '@/data/mock';
import { colors, fonts, radius } from '@/theme';

const euro = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const w = me.wallet;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <BrandHeader top={insets.top}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}>
          <BackButton />
          <T v="title">Portefeuille</T>
        </View>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
        <View style={styles.card}>
          <LinearGradient colors={['#2A2418', '#151B24', '#0B1626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.glow} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Logo size={20} tagline={false} />
            <Ionicons name="wifi" size={20} color={colors.textMuted} style={{ transform: [{ rotate: '90deg' }] }} />
          </View>
          <View>
            <T v="label" color={colors.textMuted}>
              Solde disponible
            </T>
            <T v="display" color={colors.goldBright} style={{ fontSize: 40, lineHeight: 48 }}>
              {euro(w.balance)}
            </T>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <T v="caption" color={colors.textMuted}>
                En attente de livraison
              </T>
              <T v="bodyStrong">{euro(w.pending)}</T>
            </View>
            <T v="caption" color={colors.textMuted} style={{ letterSpacing: 1.5 }}>
              {me.name.toUpperCase()}
            </T>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Button title="Retirer" icon="arrow-up" style={{ flex: 1 }} />
          <Button title="Historique" variant="dark" style={{ flex: 1 }} />
        </View>

        <View style={styles.methods}>
          <T v="small" color={colors.textMuted}>
            Retrait vers
          </T>
          {[
            ['Wave', '#1DC8FF'],
            ['Orange Money', '#FF7900'],
            ['Virement', colors.gold],
          ].map(([name, tint]) => (
            <View key={name} style={styles.method}>
              <View style={[styles.methodDot, { backgroundColor: tint }]} />
              <T v="caption">{name}</T>
            </View>
          ))}
        </View>

        <T v="title" style={{ fontSize: 24, marginTop: 28, marginBottom: 12 }}>
          Transactions
        </T>
        <Card style={{ paddingVertical: 4 }}>
          {walletTx.map((t, i) => {
            const credit = t.amount > 0;
            const pending = t.status === 'En attente';
            return (
              <View key={t.id} style={[styles.tx, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[styles.txIcon, credit && { borderColor: colors.borderGold }]}>
                  <Ionicons name={credit ? 'arrow-down' : 'arrow-up'} size={18} color={credit ? colors.gold : colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <T v="bodyStrong" numberOfLines={1}>
                    {t.label}
                  </T>
                  <T v="caption" color={colors.textMuted}>
                    {t.detail} · {t.date}
                  </T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T v="bodyStrong" color={credit ? colors.goldBright : colors.text} style={{ fontFamily: fonts.semibold }}>
                    {credit ? '+' : ''}
                    {euro(t.amount)}
                  </T>
                  <T v="caption" color={pending ? colors.warning : colors.textFaint}>
                    {t.status}
                  </T>
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 210,
    borderRadius: radius.xl,
    padding: 22,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, right: -70, top: -90, backgroundColor: colors.gold, opacity: 0.12 },
  methods: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  methodDot: { width: 8, height: 8, borderRadius: 4 },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong },
});
