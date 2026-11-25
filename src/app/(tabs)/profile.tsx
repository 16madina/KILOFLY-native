import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { art, Avatar, BrandHeader, Card, Divider, SectionHeader, Stars, T, tap, VerifiedBadge, type IconName } from '@/components/ui';
import { me } from '@/data/mock';
import { colors, fonts, radius } from '@/theme';

const menu: { icon: IconName; title: string; sub: string; href?: Href }[] = [
  { icon: 'cube-outline', title: 'Mes annonces', sub: 'Gérez vos voyages et vos demandes de colis', href: '/(tabs)/post' },
  { icon: 'swap-horizontal', title: 'Mes transactions', sub: 'Suivez vos envois, réceptions et paiements', href: '/(tabs)/tracking' },
  { icon: 'wallet-outline', title: 'Paiements', sub: 'Portefeuille, retraits, soldes et factures', href: '/wallet' },
  { icon: 'shield-checkmark-outline', title: 'Vérification', sub: 'Identité, téléphone et score de confiance' },
  { icon: 'settings-outline', title: 'Préférences', sub: 'Notifications, confidentialité, langue, etc.' },
];

export default function Profile() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <BrandHeader top={insets.top}>
        <T v="display" style={{ marginTop: 34 }}>
          Mon profil
        </T>
        <T v="body" color={colors.textMuted} style={{ marginTop: 6, maxWidth: 250 }}>
          Gérez votre compte, suivez vos activités et vos transactions.
        </T>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, gap: 14, marginTop: 20 }}>
        {/* Identity card */}
        <Card style={{ padding: 0 }}>
          <View style={styles.identity}>
            <Avatar initials={me.initials} size={104} ring verified={me.verified} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T v="title" style={{ fontSize: 24 }}>
                  {me.name.split(' ')[0]} {me.name.split(' ')[1][0]}.
                </T>
                <VerifiedBadge size={22} />
              </View>
              <Stars rating={me.rating} reviews={me.reviews} size="large" />
              {me.premium && (
                <View style={styles.premium}>
                  <Ionicons name="ribbon-outline" size={16} color={colors.gold} />
                  <T v="small" color={colors.goldBright} style={{ fontFamily: fonts.medium }}>
                    Membre Premium
                  </T>
                </View>
              )}
            </View>
          </View>
          <View style={styles.identityBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1.2 }}>
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
              <View>
                <T v="caption">Membre depuis</T>
                <T v="caption">{me.memberSince}</T>
              </View>
            </View>
            <Divider vertical style={{ marginVertical: 4 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingLeft: 10 }}>
              <Ionicons name="ribbon-outline" size={24} color={colors.gold} />
              <View>
                <T v="caption">Statut</T>
                <T v="small" color={colors.gold} style={{ fontFamily: fonts.semibold }}>
                  Premium
                </T>
              </View>
            </View>
            <Pressable style={styles.edit}>
              <Ionicons name="create-outline" size={16} color={colors.text} />
              <T v="caption">Modifier</T>
            </Pressable>
          </View>
        </Card>

        {/* Big counters */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Counter icon="airplane" value={me.trips} label="Voyages effectués" />
          <Counter icon="cube-outline" value={me.shipments} label="Colis envoyés" />
        </View>

        {/* Stats */}
        <View style={{ marginTop: 8 }}>
          <SectionHeader title="Mes statistiques" action="Voir le détail" />
          <Card style={{ flexDirection: 'row', paddingHorizontal: 4 }}>
            <Stat icon="checkmark-circle-outline" value={`${me.successRate} %`} label="Taux de succès" />
            <Divider vertical />
            <Stat icon="star-outline" value={`${me.rating.toFixed(1).replace('.', ',')}/5`} label="Note moyenne" />
            <Divider vertical />
            <Stat icon="people-outline" value={String(me.reviews)} label="Avis reçus" />
            <Divider vertical />
            <Stat icon="leaf-outline" value={me.co2} label="CO₂ évitées" />
          </Card>
        </View>

        {/* Menu */}
        <View style={{ gap: 10 }}>
          {menu.map((m) => (
            <Card
              key={m.title}
              style={styles.menuItem}
              onPress={() => {
                tap();
                if (m.href) router.push(m.href);
              }}>
              <LinearGradient colors={['#7A6443', '#4A3D2C']} style={styles.menuIcon}>
                <Ionicons name={m.icon} size={24} color={colors.goldBright} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <T v="h2" style={{ fontSize: 19 }}>
                  {m.title}
                </T>
                <T v="small" color={colors.textMuted} numberOfLines={1}>
                  {m.sub}
                </T>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Card>
          ))}
        </View>

        <Pressable onPress={() => router.push('/welcome')} style={styles.logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <T v="bodyStrong" color={colors.danger}>
            Se déconnecter
          </T>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Counter({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <View style={styles.counter}>
      <Image source={art.window} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} contentFit="cover" contentPosition="center" />
      <LinearGradient colors={['rgba(17,30,46,0.95)', 'rgba(17,30,46,0.5)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      <View style={styles.counterIcon}>
        <Ionicons name={icon} size={22} color={colors.text} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="title" style={{ fontSize: 28, lineHeight: 32 }}>
          {value}
        </T>
        <T v="caption" color={colors.textMuted}>
          {label}
        </T>
      </View>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 2 }}>
      <Ionicons name={icon} size={22} color={colors.gold} />
      <T v="h2" style={{ fontSize: 20 }}>
        {value}
      </T>
      <T v="caption" color={colors.textMuted} style={{ textAlign: 'center', fontSize: 11 }} numberOfLines={2}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  premium: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
  },
  identityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  edit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    borderColor: colors.gold,
  },
  counter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  counterIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.2,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  menuIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
});
