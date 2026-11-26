// Traveler: move the parcel to the next step. Delivery needs the code, the recipient's name and signature.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignaturePad } from '@/components/signature-pad';
import { BackButton, BrandHeader, Button, Card, T } from '@/components/ui';
import { advanceTracking, reachedStep, takePhoto, TRAVELER_STEPS, useTracking } from '@/lib/tracking';
import { colors, fonts } from '@/theme';

export default function TrackingUpdate() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { events, loading } = useTracking(id);
  const next = TRAVELER_STEPS[reachedStep(events)];

  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [recipient, setRecipient] = useState('');
  const [code, setCode] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrollOn, setScrollOn] = useState(true);

  const delivering = next?.key === 'delivered';

  async function submit() {
    if (!next) return;
    setError(null);
    if (delivering) {
      if (code.trim().length !== 6) return setError('Entrez le code de livraison à 6 chiffres.');
      if (!recipient.trim()) return setError('Indiquez le nom de la personne qui reçoit le colis.');
      if (!signature) return setError('Faites signer le destinataire.');
    }
    setBusy(true);
    const res = await advanceTracking({
      reservationId: id!,
      step: next.key,
      note,
      location,
      photo,
      recipientName: recipient,
      signatureSvg: signature ?? undefined,
      code,
    });
    setBusy(false);
    if (res.error) return setError(res.error);
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView scrollEnabled={scrollOn} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <BrandHeader top={insets.top} art={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 24 }}>
            <BackButton />
            <T v="title">Mettre à jour le suivi</T>
          </View>
        </BrandHeader>

        <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 14 }}>
          {loading ? (
            <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
          ) : !next ? (
            <Card>
              <T v="body">Le colis a déjà été livré. Merci !</T>
            </Card>
          ) : (
            <>
              <Card gold style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.icon}>
                  <Ionicons name={next.icon as never} size={22} color={colors.onGold} />
                </View>
                <View style={{ flex: 1 }}>
                  <T v="label" color={colors.gold}>
                    Prochaine étape
                  </T>
                  <T v="h2">{next.label}</T>
                </View>
              </Card>

              {delivering && (
                <>
                  <Field label="Code de livraison (donné par le destinataire)">
                    <TextInput
                      value={code}
                      onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      placeholder="••••••"
                      placeholderTextColor={colors.textFaint}
                      style={[styles.input, { fontSize: 24, letterSpacing: 10, textAlign: 'center', fontFamily: fonts.bold }]}
                    />
                  </Field>
                  <Field label="Nom de la personne qui reçoit le colis">
                    <TextInput value={recipient} onChangeText={setRecipient} placeholder="Ex. Awa Traoré" placeholderTextColor={colors.textFaint} style={styles.input} autoCapitalize="words" />
                  </Field>
                  <Field label="Signature du destinataire">
                    {/* Stop the page from scrolling while signing. */}
                    <View onTouchStart={() => setScrollOn(false)} onTouchEnd={() => setScrollOn(true)} onTouchCancel={() => setScrollOn(true)}>
                      <SignaturePad onChange={setSignature} />
                    </View>
                  </Field>
                </>
              )}

              <Field label={delivering ? 'Photo du colis remis (conseillée)' : 'Photo (facultatif)'}>
                <Pressable onPress={async () => setPhoto(await takePhoto())} style={styles.photo}>
                  {photo ? (
                    <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={26} color={colors.gold} />
                      <T v="small" color={colors.textMuted}>
                        Prendre une photo
                      </T>
                    </>
                  )}
                </Pressable>
              </Field>

              {!delivering && (
                <Field label="Lieu (facultatif)">
                  <TextInput value={location} onChangeText={setLocation} placeholder="Ex. Aéroport CDG" placeholderTextColor={colors.textFaint} style={styles.input} />
                </Field>
              )}
              <Field label="Message pour l'expéditeur (facultatif)">
                <TextInput value={note} onChangeText={setNote} placeholder="Tout se passe bien…" placeholderTextColor={colors.textFaint} style={[styles.input, { height: 80, paddingTop: 12 }]} multiline maxLength={500} />
              </Field>

              {error && (
                <T v="small" color={colors.danger} style={{ textAlign: 'center' }}>
                  {error}
                </T>
              )}
              {busy ? <ActivityIndicator color={colors.gold} style={{ height: 56 }} /> : <Button title={next.action} icon="checkmark" onPress={submit} />}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <T v="caption" color={colors.textMuted}>
        {label}
      </T>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  input: {
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  photo: {
    height: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
    backgroundColor: colors.field,
  },
});
