import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TicketCard } from '@/components/ticket-card';
import { AccentTitle, Avatar, BrandHeader, Button, Card, GoldPill, SectionHeader, T, tap, type IconName } from '@/components/ui';
import { cityCodes, cityImages, listings, popularRoutes, transportRequests } from '@/data/mock';
import { colors, fonts, gradients, radius } from '@/theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <BrandHeader top={insets.top}>
        <AccentTitle before={'Envoyez vos colis\navec '} accent="des voyageurs" style={{ marginTop: 36 }} />
        <T v="body" color={colors.textMuted} style={{ marginTop: 8, maxWidth: 260 }}>
          Un espace dans une valise, des colis qui voyagent plus loin.
        </T>
      </BrandHeader>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginTop: 26 }}>
        <Card style={{ paddingTop: 6 }}>
          <View style={styles.tabs}>
            <View style={[styles.tab, styles.tabActive]}>
              <Ionicons name="airplane" size={15} color={colors.text} />
              <T v="caption" style={{ fontFamily: fonts.semibold }} numberOfLines={1}>
                Rechercher un voyage
              </T>
            </View>
            <Pressable style={styles.tab} onPress={() => (tap(), router.push('/post-listing'))}>
              <Ionicons name="briefcase-outline" size={15} color={colors.textMuted} />
              <T v="caption" color={colors.textMuted} numberOfLines={1}>
                Proposer un voyage
              </T>
            </Pressable>
          </View>

          <View style={{ gap: 10, marginTop: 14 }}>
            <Field icon="location-outline" label="Départ" placeholder="Ville ou pays de départ" value={from} onChange={setFrom} />
            <Field icon="location-outline" label="Destination" placeholder="Ville ou pays d’arrivée" value={to} onChange={setTo} />
            <Pressable
              style={styles.swap}
              onPress={() => {
                tap();
                setFrom(to);
                setTo(from);
              }}>
              <Ionicons name="swap-vertical" size={16} color={colors.text} />
            </Pressable>
            <Field icon="calendar-outline" label="Date" placeholder="Sélectionner une date" />
          </View>

          <Button title="Rechercher un voyage" leftIcon="search" style={{ marginTop: 16 }} />
        </Card>
      </View>

      {/* Available trips */}
      <View style={styles.section}>
        <SectionHeader title="Voyages disponibles" action="Voir plus" />
        <View style={{ gap: 14 }}>
          {listings.map((l) => (
            <TicketCard key={l.id} listing={l} />
          ))}
        </View>
      </View>

      {/* Popular routes */}
      <View style={styles.section}>
        <SectionHeader title="Routes populaires" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {popularRoutes.map((r) => (
          <Pressable
            key={`${r.from}-${r.to}`}
            onPress={() => {
              tap();
              setFrom(r.from);
              setTo(r.to);
            }}
            style={({ pressed }) => [styles.routeCard, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Image source={cityImages[r.to]} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={gradients.photoFade} style={StyleSheet.absoluteFill} />
            <GoldPill label={`${r.count} trajets`} style={{ backgroundColor: 'rgba(3,15,30,0.6)' }} />
            <View>
              <T v="caption" color={colors.gold} style={{ letterSpacing: 1 }}>
                {cityCodes[r.from]} → {cityCodes[r.to]}
              </T>
              <T v="h2">{r.to}</T>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Transport requests */}
      <View style={styles.section}>
        <SectionHeader title="Ils cherchent un voyageur" />
        <Card style={{ paddingVertical: 4 }}>
          {transportRequests.map((r, i) => (
            <View key={r.id} style={[styles.request, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Avatar initials={r.initials} size={42} />
              <View style={{ flex: 1 }}>
                <T v="bodyStrong" numberOfLines={1}>
                  {r.item}
                </T>
                <T v="caption" color={colors.textMuted}>
                  {r.from} → {r.to} · {r.kg} kg · {r.when}
                </T>
              </View>
              <GoldPill label={r.budget} />
            </View>
          ))}
        </Card>
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <SectionHeader title="Comment ça marche" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(
            [
              ['search', 'Trouvez un voyageur'],
              ['shield-checkmark-outline', 'Payez en sécurité'],
              ['airplane-outline', 'Suivez votre colis'],
            ] as [IconName, string][]
          ).map(([icon, text]) => (
            <Card key={text} style={styles.how}>
              <View style={styles.howIcon}>
                <Ionicons name={icon} size={22} color={colors.gold} />
              </View>
              <T v="small" style={{ textAlign: 'center' }}>
                {text}
              </T>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Field({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: IconName;
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <T v="small" style={{ fontFamily: fonts.semibold, width: 82 }}>
        {label}
      </T>
      {onChange ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      ) : (
        <T v="small" color={colors.textMuted} style={{ flex: 1 }} numberOfLines={1}>
          {placeholder}
        </T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: colors.gold, marginBottom: -1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.text, minWidth: 0 },
  swap: {
    position: 'absolute',
    right: -6,
    top: 38,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardHi,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    zIndex: 2,
  },
  section: { paddingHorizontal: 16, marginTop: 30 },
  routeCard: {
    width: 140,
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  request: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  how: { flex: 1, alignItems: 'center', gap: 10, paddingVertical: 18, paddingHorizontal: 8 },
  howIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
