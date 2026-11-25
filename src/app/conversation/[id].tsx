import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  art,
  Avatar,
  BackButton,
  Chip,
  Divider,
  IconButton,
  Logo,
  T,
  tap,
  VerifiedBadge,
  type IconName,
} from '@/components/ui';
import { cityCodes, conversations, listings, me, messages as initial, shortName } from '@/data/mock';
import { colors, fonts, radius } from '@/theme';

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = conversations.find((x) => x.id === id) ?? conversations[0];
  const l = listings.find((x) => x.traveler.id === c.travelerId) ?? listings[0];
  const t = l.traveler;
  const insets = useSafeAreaInsets();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [msgs, setMsgs] = useState(initial);
  const [text, setText] = useState('');
  const kg = 3;
  const total = kg * l.pricePerKg;

  const send = () => {
    if (!text.trim()) return;
    tap();
    setMsgs([...msgs, { id: String(Date.now()), mine: true, text: text.trim(), time: 'à l’instant' }]);
    setText('');
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, overflow: 'hidden' }}>
          <View pointerEvents="none" style={styles.headerArt}>
            <Image source={art.window} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="left" />
            <LinearGradient colors={[colors.bg, 'rgba(3,15,30,0.2)', colors.bg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['rgba(3,15,30,0)', colors.bg]} start={{ x: 0, y: 0.5 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Logo size={24} tagline="Messagerie · Négociation sécurisée" />
            <IconButton icon="ellipsis-horizontal" size={40} />
          </View>

          <View style={styles.person}>
            <BackButton />
            <Avatar photo={t.photo} initials={t.initials} size={54} verified={t.verified} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T v="h2" style={{ fontSize: 19, flexShrink: 1 }} numberOfLines={1}>
                  {shortName(t.name)}
                </T>
                {t.verified && <VerifiedBadge size={17} />}
              </View>
              <View style={styles.verifiedPill}>
                <Ionicons name="shield-checkmark-outline" size={12} color={colors.gold} />
                <T v="caption" color={colors.textMuted}>
                  Trajet vérifié
                </T>
              </View>
            </View>
            <IconButton icon="call-outline" size={38} />
            <IconButton icon="videocam-outline" size={38} />
          </View>

          <View style={styles.routeLine}>
            <Ionicons name="airplane" size={16} color={colors.text} />
            <T v="small">
              {l.from} ({cityCodes[l.from]}) → {l.to} ({cityCodes[l.to]})
            </T>
            <View style={{ flex: 1 }} />
            <Ionicons name="calendar-outline" size={15} color={colors.text} />
            <T v="small">{l.departDate.replace(/^\S+ /, '')}</T>
          </View>
        </View>

        <View style={{ paddingHorizontal: 14, gap: 12 }}>
          {/* Shipment under negotiation */}
          <View style={styles.shipment}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={art.box} style={{ width: 66, height: 50 }} contentFit="contain" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="h2" style={{ fontSize: 18 }} numberOfLines={1}>
                  Envoi de colis
                </T>
                <T v="caption" color={colors.textMuted} numberOfLines={1}>
                  Proposition en discussion
                </T>
              </View>
              <View style={styles.negPill}>
                <T v="small" color={colors.goldBright} style={{ fontFamily: fonts.medium }}>
                  Négociation
                </T>
              </View>
            </View>
            <Divider style={{ marginVertical: 10 }} />
            <View style={{ flexDirection: 'row' }}>
              <Spec icon="airplane" title="Trajet" value={`${cityCodes[l.from]}→${cityCodes[l.to]}`} />
              <Divider vertical />
              <Spec icon="calendar-outline" title="Date" value={l.departDate.replace(/^\S+ /, '')} />
              <Divider vertical />
              <Spec icon="briefcase-outline" title="Poids" value={`${kg},0 kg`} />
              <Divider vertical />
              <Spec icon="cash-outline" title="Prix" value={`${l.pricePerKg} €/kg`} gold />
            </View>
          </View>

          <View style={styles.dayRow}>
            <Divider style={{ flex: 1 }} />
            <View style={styles.dayPill}>
              <T v="small">Aujourd’hui</T>
            </View>
            <Divider style={{ flex: 1 }} />
          </View>

          {msgs.map((m) => (
            <View key={m.id} style={[styles.msgRow, m.mine && { flexDirection: 'row-reverse' }]}>
              {m.mine ? <Avatar initials={me.initials} size={38} /> : <Avatar photo={t.photo} initials={t.initials} size={38} />}
              <View style={[styles.bubble, m.mine ? styles.mine : styles.theirs]}>
                {m.mine && (
                  <LinearGradient
                    colors={['rgba(150,128,88,0.55)', 'rgba(70,62,50,0.6)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                  />
                )}
                <T v="body" style={{ lineHeight: 21 }}>
                  {m.text}
                </T>
                <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <T v="caption" color={colors.textMuted}>
                    {m.time}
                  </T>
                  {m.mine && <Ionicons name="checkmark-done" size={15} color={colors.text} />}
                </View>
              </View>
            </View>
          ))}

          {/* Accepted offer */}
          <Pressable
            style={styles.offer}
            onPress={() => router.push({ pathname: '/payment', params: { id: l.id, kg: String(kg) } })}>
            <View style={styles.offerIcon}>
              <Ionicons name="hand-left-outline" size={22} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T v="h3" style={{ fontFamily: fonts.serif, fontSize: 16 }} numberOfLines={1}>
                  Offre acceptée
                </T>
                <VerifiedBadge size={17} />
              </View>
              <T v="caption" color={colors.textMuted}>
                Envoi de colis · {l.from} → {l.to}
              </T>
            </View>
            <View style={styles.offerPrice}>
              <View style={{ alignItems: 'center' }}>
                <T v="h2" color={colors.goldBright}>
                  {total} €
                </T>
                <T v="caption" color={colors.textMuted}>
                  ({kg},0 kg × {l.pricePerKg} €/kg)
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Quick actions + composer */}
      <View style={{ paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.bg }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 14, paddingVertical: 10 }}>
          {(
            [
              ['camera-outline', 'Photos'],
              ['cube-outline', 'Détails du colis'],
              ['pricetag-outline', 'Faire une offre'],
              ['shield-checkmark-outline', 'Payer / Sécuriser'],
            ] as [IconName, string][]
          ).map(([icon, label]) => (
            <Chip
              key={label}
              icon={icon}
              label={label}
              onPress={label.startsWith('Payer') ? () => router.push({ pathname: '/payment', params: { id: l.id, kg: String(kg) } }) : () => {}}
            />
          ))}
        </ScrollView>
        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <Ionicons name="attach" size={22} color={colors.text} style={{ transform: [{ rotate: '45deg' }] }} />
            <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={send}
              placeholder="Écrivez un message…"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <Ionicons name="happy-outline" size={22} color={colors.text} />
          </View>
          <Pressable onPress={send} style={({ pressed }) => [pressed && { transform: [{ scale: 0.92 }] }]}>
            <LinearGradient colors={['#F2D29C', '#D9AD6C']} style={styles.send}>
              <Ionicons name="paper-plane" size={22} color={colors.onGold} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Spec({ icon, title, value, gold }: { icon: IconName; title: string; value: string; gold?: boolean }) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 5, gap: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Ionicons name={icon} size={14} color={colors.text} />
        <T v="caption">{title}</T>
      </View>
      <T
        v={gold ? 'bodyStrong' : 'caption'}
        color={gold ? colors.goldBright : colors.text}
        style={gold ? { fontFamily: fonts.bold } : { fontFamily: fonts.medium }}
        numberOfLines={1}>
        {value}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  headerArt: { position: 'absolute', right: -30, top: 40, width: 260, height: 190, opacity: 0.85 },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 2 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 18 },
  routeLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 14, paddingLeft: 4 },
  shipment: {
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  negPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1.2, borderColor: colors.gold },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bubble: { maxWidth: '76%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, overflow: 'hidden' },
  theirs: { backgroundColor: '#1A2B40', borderWidth: 1, borderColor: colors.border },
  mine: { borderWidth: 1, borderColor: 'rgba(228,188,131,0.6)' },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginTop: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  offerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgRaised,
  },
  offerPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgRaised,
  },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, minWidth: 0 },
  send: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
