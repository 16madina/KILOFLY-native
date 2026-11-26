// "Laisser un avis" after delivery, and star rows.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, T, tap } from '@/components/ui';
import { myReviewFor, submitReview } from '@/lib/reviews';
import { colors, fonts } from '@/theme';

const LABELS = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent'];

export function StarInput({ value, onChange, size = 34 }: { value: number; onChange: (n: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => (tap(), onChange(n))} hitSlop={4}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size} color={colors.gold} />
        </Pressable>
      ))}
    </View>
  );
}

export function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= Math.round(value) ? 'star' : 'star-outline'} size={size} color={colors.gold} />
      ))}
    </View>
  );
}

export function ReviewPrompt({ reservationId, otherName }: { reservationId: string; otherName: string }) {
  const [existing, setExisting] = useState<{ rating: number; comment: string | null } | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    myReviewFor(reservationId).then(setExisting);
  }, [reservationId]);

  if (existing === undefined) return null;
  if (existing) {
    return (
      <Card style={{ gap: 6 }}>
        <T v="caption" color={colors.textMuted}>
          Votre avis sur {otherName}
        </T>
        <StarRow value={existing.rating} size={18} />
        {!!existing.comment && <T v="small">« {existing.comment} »</T>}
      </Card>
    );
  }

  const send = async () => {
    if (!rating) return setError('Choisissez une note.');
    setBusy(true);
    setError(null);
    const r = await submitReview(reservationId, rating, comment);
    setBusy(false);
    if (r.error) return setError(r.error);
    setExisting({ rating, comment });
  };

  return (
    <Card gold style={{ gap: 10, alignItems: 'center' }}>
      <T v="h2" style={{ textAlign: 'center' }}>
        Comment s’est passé l’échange avec {otherName} ?
      </T>
      <StarInput value={rating} onChange={setRating} />
      <T v="small" color={colors.goldBright} style={{ fontFamily: fonts.semibold, minHeight: 18 }}>
        {LABELS[rating]}
      </T>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Un mot pour la communauté (facultatif)"
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
      {busy ? <ActivityIndicator color={colors.gold} /> : <Button title="Publier mon avis" small icon="send" onPress={send} style={{ alignSelf: 'stretch' }} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  input: {
    alignSelf: 'stretch',
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
