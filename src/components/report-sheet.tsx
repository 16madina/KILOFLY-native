// "Signaler" bottom sheet: reason + optional details, sent through report_content().
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, T, tap } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

export const REPORT_REASONS: [string, string][] = [
  ['fraud', 'Arnaque ou tentative de paiement hors de KiloFly'],
  ['prohibited_items', 'Objets interdits ou dangereux'],
  ['harassment', 'Harcèlement, menaces ou insultes'],
  ['fake_profile', 'Faux profil ou usurpation d’identité'],
  ['no_show', 'Ne s’est pas présenté / colis non livré'],
  ['inappropriate', 'Contenu inapproprié'],
  ['other', 'Autre'],
];

export function ReportSheet({
  visible,
  onClose,
  userId,
  userName,
  listingId,
  conversationId,
}: {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName?: string | null;
  listingId?: string;
  conversationId?: string;
}) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    onClose();
    setTimeout(() => {
      setReason(null);
      setDetails('');
      setDone(false);
      setError(null);
    }, 300);
  };

  const send = async () => {
    if (!reason) return setError('Choisissez un motif.');
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.rpc('report_content', {
      p_reported_user: userId,
      p_reason: reason,
      p_details: details || null,
      p_listing_id: listingId ?? null,
      p_conversation_id: conversationId ?? null,
    });
    setBusy(false);
    if (e) {
      const m = e.message;
      return setError(
        m.includes('already reported')
          ? 'Vous avez déjà signalé cette personne. Notre équipe s’en occupe.'
          : m.includes('too many')
            ? 'Trop de signalements aujourd’hui. Réessayez demain.'
            : m.includes('not signed in')
              ? 'Connectez-vous pour signaler.'
              : 'Le signalement n’a pas pu être envoyé.',
      );
    }
    setDone(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.back} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.sheet} contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="flag" size={20} color={colors.danger} />
            <T v="h2" style={{ flex: 1, marginLeft: 8 }}>
              Signaler {userName ? userName.split(' ')[0] : ''}
            </T>
            <Pressable onPress={close} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {done ? (
            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20 }}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <T v="bodyStrong" style={{ textAlign: 'center' }}>
                Merci, votre signalement a été envoyé.
              </T>
              <T v="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
                L’équipe KiloFly l’examine rapidement. La personne signalée ne sait pas que c’est vous. Vous pouvez aussi la bloquer depuis son profil.
              </T>
              <Button title="Fermer" small onPress={close} style={{ alignSelf: 'stretch', marginTop: 8 }} />
            </View>
          ) : (
            <>
              <T v="small" color={colors.textMuted}>
                Votre signalement est confidentiel. En cas de danger immédiat, contactez les autorités.
              </T>
              {REPORT_REASONS.map(([k, l]) => (
                <Pressable key={k} onPress={() => (tap(), setReason(k))} style={[styles.reason, reason === k && styles.reasonOn]}>
                  <Ionicons name={reason === k ? 'radio-button-on' : 'radio-button-off'} size={20} color={reason === k ? colors.gold : colors.textMuted} />
                  <T v="body" style={{ flex: 1 }}>
                    {l}
                  </T>
                </Pressable>
              ))}
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Décrivez ce qui s’est passé (facultatif)"
                placeholderTextColor={colors.textFaint}
                multiline
                maxLength={1000}
                style={styles.input}
              />
              {error && (
                <T v="small" color={colors.danger}>
                  {error}
                </T>
              )}
              {busy ? <ActivityIndicator color={colors.gold} style={{ height: 50 }} /> : <Button title="Envoyer le signalement" leftIcon="flag-outline" onPress={send} />}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  back: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { maxHeight: '90%', backgroundColor: colors.bgRaised, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  reasonOn: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  input: {
    minHeight: 80,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
