import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Loading } from '@/components/listing-bits';
import { Avatar, BackButton, BrandHeader, Button, Card, Divider, GoldPill, T, tap, VerifiedBadge , IconButton } from '@/components/ui';
import { initialsOf, useAuth } from '@/lib/auth';
import { cityCode } from '@/lib/cities';
import { currencySymbol, fetchListings, money, shortDate, type ListingCard } from '@/lib/listings';
import { fetchOffers, fetchRequest, makeOffer, respondOffer, type Offer, type RequestDetail } from '@/lib/offers';
import { colors, fonts, radius } from '@/theme';

const OFFER_STATUS: Record<Offer['status'], string> = { pending: 'En attente', accepted: 'Acceptée', rejected: 'Refusée' };

export default function RequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading } = useAuth();
  const [req, setReq] = useState<RequestDetail | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [myTrips, setMyTrips] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  // offer form
  const [listingId, setListingId] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!id || !session) return;
    setLoading(true);
    try {
      const r = await fetchRequest(id);
      setReq(r);
      if (r) {
        setOffers(await fetchOffers(id));
        if (r.userId !== session.user.id) {
          const mine = (await fetchListings({ mine: true, limit: 100 })).filter((l) => l.status === 'active' && l.remainingKg >= r.kg);
          setMyTrips(mine);
          setListingId((cur) => cur ?? mine[0]?.id ?? null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (authLoading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!session) return <Redirect href={{ pathname: '/auth', params: { mode: 'login' } }} />;
  if (loading && !req) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 60 }}>
        <Loading />
      </View>
    );
  }
  if (!req) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 20, paddingHorizontal: 16, gap: 16 }}>
        <BackButton />
        <EmptyState icon="cube-outline" title="Demande introuvable" text="Cette demande n’est plus disponible." />
      </View>
    );
  }

  const isOwner = req.userId === session.user.id;
  const myOffer = offers.find((o) => o.isMine);
  const selected = myTrips.find((t) => t.id === listingId);
  const suggested = selected ? Math.round(selected.pricePerKg * req.kg * 100) / 100 : null;

  const send = async () => {
    setError(null);
    setInfo(null);
    if (!listingId) return setError('Choisissez le trajet sur lequel vous transporterez ce colis.');
    const p = Number((price || String(suggested ?? '')).replace(',', '.'));
    if (!(p > 0)) return setError('Indiquez votre prix total.');
    setBusy(true);
    const r = await makeOffer(req.id, listingId, p, message);
    setBusy(false);
    if (r.error) return setError(r.error);
    setInfo('Offre envoyée ! L’expéditeur va être prévenu.');
    load();
  };

  const answer = async (o: Offer, accept: boolean) => {
    setError(null);
    setBusy(true);
    const r = await respondOffer(o.id, accept);
    setBusy(false);
    if (r.error) return setError(r.error);
    if (accept && r.reservationId) {
      router.replace({ pathname: '/reservation/[id]', params: { id: r.reservationId } });
      return;
    }
    load();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <BrandHeader top={insets.top} art={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 24 }}>
            <BackButton />
            <T v="title" style={{ flex: 1 }}>
              {isOwner ? 'Ma demande' : 'Demande d’envoi'}
            </T>
            {isOwner && (req.status === 'active' || req.status === 'cancelled') && (
              <IconButton icon="create-outline" size={40} onPress={() => router.push({ pathname: '/post-request', params: { edit: req.id } })} />
            )}
          </View>
        </BrandHeader>

        <View style={{ paddingHorizontal: 16, gap: 14, marginTop: 18 }}>
          <Card gold>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <T v="display">{cityCode(req.from)}</T>
                <T v="small" color={colors.textMuted}>
                  {req.from}
                </T>
              </View>
              <Ionicons name="airplane" size={26} color={colors.gold} style={{ alignSelf: 'center' }} />
              <View style={{ alignItems: 'flex-end' }}>
                <T v="display">{cityCode(req.to)}</T>
                <T v="small" color={colors.textMuted}>
                  {req.to}
                </T>
              </View>
            </View>
            <Divider style={{ marginVertical: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Fact label="Poids" value={`${req.kg} kg`} />
              <Fact label="Départ" value={req.dateEnd ? `${shortDate(req.dateStart)} – ${shortDate(req.dateEnd)}` : `dès le ${shortDate(req.dateStart)}`} />
              <Fact label="Budget" value={req.budgetMax ? `≤ ${money(req.budgetMax, req.currency)}` : '—'} />
            </View>
            {req.description && (
              <T v="body" style={{ marginTop: 12 }}>
                {req.description}
              </T>
            )}
          </Card>

          {isOwner ? (
            <>
              <T v="h2">Offres reçues ({offers.length})</T>
              {offers.length === 0 ? (
                <EmptyState icon="hourglass-outline" title="Pas encore d’offre" text="Les voyageurs qui font ce trajet vous enverront leur proposition ici." />
              ) : (
                offers.map((o) => (
                  <Card key={o.id} style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Avatar photo={o.traveler.avatar ? { uri: o.traveler.avatar } : undefined} initials={initialsOf(o.traveler.name)} size={44} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <T v="bodyStrong">{o.traveler.name}</T>
                          {o.traveler.verified && <VerifiedBadge size={15} />}
                        </View>
                        {o.listing && (
                          <T v="caption" color={colors.textMuted}>
                            Vol du {shortDate(o.listing.departDate)} · {o.listing.from} → {o.listing.to}
                          </T>
                        )}
                      </View>
                      <GoldPill label={money(o.price, o.listing?.currency ?? req.currency)} />
                    </View>
                    {o.message && <T v="small">{o.message}</T>}
                    {o.status === 'pending' ? (
                      busy ? (
                        <ActivityIndicator color={colors.gold} />
                      ) : (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <Button title="Refuser" small variant="dark" onPress={() => answer(o, false)} style={{ flex: 1 }} />
                          <Button title="Accepter" small icon="checkmark" onPress={() => answer(o, true)} style={{ flex: 1.3 }} />
                        </View>
                      )
                    ) : (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <T v="caption" color={o.status === 'accepted' ? colors.success : colors.textMuted}>
                          {OFFER_STATUS[o.status]}
                        </T>
                        {o.reservationId && (
                          <Pressable onPress={() => router.push({ pathname: '/reservation/[id]', params: { id: o.reservationId! } })}>
                            <T v="caption" color={colors.gold}>
                              Voir la réservation →
                            </T>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </Card>
                ))
              )}
            </>
          ) : myOffer && myOffer.status !== 'pending' ? (
            <Card>
              <T v="h3">Votre offre : {OFFER_STATUS[myOffer.status]}</T>
              {myOffer.reservationId && (
                <Button
                  title="Voir la réservation"
                  small
                  style={{ marginTop: 10 }}
                  onPress={() => router.push({ pathname: '/reservation/[id]', params: { id: myOffer.reservationId! } })}
                />
              )}
            </Card>
          ) : (
            <>
              <T v="h2">{myOffer ? 'Modifier mon offre' : 'Proposer de transporter ce colis'}</T>
              {myTrips.length === 0 ? (
                <EmptyState
                  icon="airplane-outline"
                  title="Aucun trajet compatible"
                  text={`Publiez un trajet avec au moins ${req.kg} kg disponibles pour faire une offre.`}
                  action={<Button title="Publier un trajet" small icon="arrow-forward" onPress={() => router.push('/post-listing')} />}
                />
              ) : (
                <>
                  <T v="caption" color={colors.textMuted}>
                    Sur quel trajet ?
                  </T>
                  {myTrips.map((t) => (
                    <Pressable key={t.id} onPress={() => (tap(), setListingId(t.id))} style={[styles.trip, listingId === t.id && styles.tripActive]}>
                      <Ionicons name={listingId === t.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={colors.gold} />
                      <T v="small" style={{ flex: 1 }}>
                        {t.from} → {t.to} · {shortDate(t.departDate)} · {t.remainingKg} kg dispo
                      </T>
                    </Pressable>
                  ))}
                  <T v="caption" color={colors.textMuted}>
                    Votre prix total pour {req.kg} kg
                  </T>
                  <View style={styles.priceBox}>
                    <TextInput
                      value={price}
                      onChangeText={(v) => setPrice(v.replace(/[^0-9.,]/g, ''))}
                      keyboardType="decimal-pad"
                      placeholder={suggested ? String(suggested) : '—'}
                      placeholderTextColor={colors.textFaint}
                      style={styles.priceInput}
                    />
                    <T v="h2" color={colors.textMuted}>
                      {currencySymbol(selected?.currency ?? req.currency)}
                    </T>
                  </View>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    placeholder="Un mot pour l’expéditeur (facultatif)"
                    placeholderTextColor={colors.textFaint}
                    style={styles.message}
                    maxLength={300}
                  />
                  {busy ? (
                    <ActivityIndicator color={colors.gold} style={{ height: 56 }} />
                  ) : (
                    <Button title={myOffer ? 'Mettre à jour mon offre' : 'Envoyer mon offre'} icon="arrow-forward" onPress={send} />
                  )}
                </>
              )}
            </>
          )}

          {error && (
            <T v="small" color={colors.danger} style={{ textAlign: 'center' }}>
              {error}
            </T>
          )}
          {info && (
            <T v="small" color={colors.success} style={{ textAlign: 'center' }}>
              {info}
            </T>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexShrink: 1 }}>
      <T v="caption" color={colors.textMuted}>
        {label}
      </T>
      <T v="small" style={{ fontFamily: fonts.semibold }}>
        {value}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  trip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tripActive: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    height: 60,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
  },
  priceInput: { flex: 1, fontFamily: fonts.serif, fontSize: 26, color: colors.text, minWidth: 0 },
  message: {
    minHeight: 80,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
