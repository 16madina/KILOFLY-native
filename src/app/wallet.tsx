import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirm, notify } from '@/components/admin-ui';
import { BackButton, BrandHeader, Button, Card, Logo, T } from '@/components/ui';
import { findCountry } from '@/data/countries';
import { useAuth } from '@/lib/auth';
import { money } from '@/lib/listings';
import { cancelWithdrawal, methodLabel, PAYOUT_METHODS, requestWithdrawal, useWallet, type WalletTx } from '@/lib/wallet';
import { colors, fonts, radius } from '@/theme';

const STATUS: Record<WalletTx['status'], { label: string; color: string }> = {
  completed: { label: 'Terminé', color: colors.textFaint },
  pending: { label: 'En cours', color: colors.warning },
  processing: { label: 'Envoi en cours', color: colors.warning },
  failed: { label: 'Refusé', color: colors.danger },
  cancelled: { label: 'Annulé', color: colors.textFaint },
};

const day = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile, loading } = useAuth();
  const { wallet, history, reload } = useWallet();
  const [open, setOpen] = useState(false);
  const [tooLow, setTooLow] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      if (!session) router.replace('/auth');
      else reload();
    }, [loading, session, reload]),
  );

  if (loading || !session) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  const cur = wallet?.currency ?? 'EUR';

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
            {wallet ? (
              <T v="display" color={colors.goldBright} style={{ fontSize: 38, lineHeight: 46 }}>
                {money(wallet.balance, cur)}
              </T>
            ) : (
              <ActivityIndicator color={colors.gold} style={{ alignSelf: 'flex-start', marginVertical: 12 }} />
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <T v="caption" color={colors.textMuted}>
                En attente de livraison
              </T>
              <T v="bodyStrong">{money(wallet?.pending ?? 0, cur)}</T>
            </View>
            <T v="caption" color={colors.textMuted} style={{ letterSpacing: 1.5 }} numberOfLines={1}>
              {(profile?.full_name ?? '').toUpperCase()}
            </T>
          </View>
        </View>

        {!!wallet?.withdrawing && (
          <T v="small" color={colors.warning} style={{ marginTop: 10 }}>
            Retrait en cours : {money(wallet.withdrawing, cur)}
          </T>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Button
            title="Retirer"
            icon="arrow-up"
            style={{ flex: 1 }}
            onPress={() => {
              if (!wallet || wallet.balance < wallet.min_withdrawal) return setTooLow(true);
              setOpen(true);
            }}
          />
        </View>
        {tooLow && (
          <View style={styles.tooLow}>
            <Ionicons name="information-circle" size={18} color={colors.gold} />
            <T v="small" style={{ flex: 1 }}>
              Vous pourrez retirer vos fonds dès que votre solde atteint {money(wallet?.min_withdrawal ?? 10, cur)}. Solde actuel : {money(wallet?.balance ?? 0, cur)}.
            </T>
          </View>
        )}
        <T v="caption" color={colors.textFaint} style={{ marginTop: 8 }}>
          L’argent d’un transport arrive ici quand la livraison est confirmée avec le code du destinataire. Gains totaux : {money(wallet?.total_earned ?? 0, cur)}.
        </T>

        <T v="title" style={{ fontSize: 24, marginTop: 28, marginBottom: 12 }}>
          Historique
        </T>
        <Card style={{ paddingVertical: 4 }}>
          {!history ? (
            <ActivityIndicator color={colors.gold} style={{ margin: 20 }} />
          ) : history.length === 0 ? (
            <T v="small" color={colors.textMuted} style={{ paddingVertical: 16, textAlign: 'center' }}>
              Aucun mouvement pour l’instant.
            </T>
          ) : (
            history.map((t, i) => {
              const credit = t.type === 'credit';
              const s = STATUS[t.status];
              return (
                <Pressable
                  key={t.id}
                  disabled={!t.reservation_id && t.status !== 'pending'}
                  onPress={async () => {
                    if (t.reservation_id) return router.push({ pathname: '/reservation/[id]', params: { id: t.reservation_id } });
                    if (t.status === 'pending' && (await confirm('Annuler ce retrait ?', 'Le montant reviendra sur votre solde.'))) {
                      const r = await cancelWithdrawal(t.id);
                      if (r.error) notify(r.error);
                      reload();
                    }
                  }}
                  style={[styles.tx, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={[styles.txIcon, credit && { borderColor: colors.borderGold }]}>
                    <Ionicons name={credit ? 'arrow-down' : 'arrow-up'} size={18} color={credit ? colors.gold : colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="bodyStrong" numberOfLines={1}>
                      {credit ? (t.route ? `Transport ${t.route}` : t.description ?? 'Crédit') : `Retrait ${methodLabel(t.payout_method)}`}
                    </T>
                    <T v="caption" color={colors.textMuted} numberOfLines={2}>
                      {day(t.created_at)}
                      {t.status === 'pending' && !credit ? ' · touchez pour annuler' : ''}
                      {t.note ? ` · ${t.note}` : ''}
                    </T>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <T v="bodyStrong" color={credit ? colors.goldBright : colors.text} style={{ fontFamily: fonts.semibold }}>
                      {credit ? '+' : '−'}
                      {money(t.amount, cur)}
                    </T>
                    <T v="caption" color={s.color}>
                      {s.label}
                    </T>
                  </View>
                </Pressable>
              );
            })
          )}
        </Card>
      </View>

      {wallet && (
        <WithdrawSheet
          visible={open}
          onClose={() => setOpen(false)}
          balance={wallet.balance}
          min={wallet.min_withdrawal}
          currency={cur}
          defaultPhone={profile?.phone ?? ''}
          country={profile?.country ?? ''}
          onDone={(status) => {
            setOpen(false);
            reload();
            notify(
              status === 'completed'
                ? 'C’est envoyé ! L’argent est arrivé sur votre compte mobile money.'
                : status === 'processing'
                  ? 'Envoi en cours sur votre compte mobile money. Vous recevrez une notification dès que c’est arrivé.'
                  : status === 'failed'
                    ? 'L’opérateur a refusé l’envoi. Le montant est de retour sur votre portefeuille : vérifiez le numéro et réessayez.'
                    : 'Demande envoyée. Vous serez notifié dès que le virement est fait (en général sous 48 h).',
            );
          }}
        />
      )}
    </ScrollView>
  );
}

function WithdrawSheet({
  visible,
  onClose,
  balance,
  min,
  currency,
  defaultPhone,
  country,
  onDone,
}: {
  visible: boolean;
  onClose: () => void;
  balance: number;
  min: number;
  currency: string;
  defaultPhone: string;
  country: string;
  onDone: (status?: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const isCanada = findCountry(country)?.code === 'CA';
  const [method, setMethod] = useState(isCanada ? 'interac' : currency === 'XOF' ? 'wave' : 'bank_transfer');
  const [amount, setAmount] = useState(String(balance));
  const [phone, setPhone] = useState(defaultPhone);
  const [iban, setIban] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kind = PAYOUT_METHODS.find((m) => m.key === method)?.kind ?? 'phone';

  const submit = async () => {
    const n = Number(amount.replace(',', '.'));
    if (!n || n < min) return setError(`Minimum ${money(min, currency)}.`);
    if (n > balance) return setError('Montant supérieur à votre solde.');
    setBusy(true);
    setError(null);
    const r = await requestWithdrawal({ amount: n, method, phone, iban, email, accountName: name });
    setBusy(false);
    if (r.error) return setError(r.error);
    onDone(r.status);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.sheet} contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <T v="h2" style={{ flex: 1 }}>
              Retirer mon argent
            </T>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <T v="caption" color={colors.textMuted}>
            Disponible : {money(balance, currency)} · minimum {money(min, currency)}
          </T>

          <T v="caption" color={colors.textMuted}>
            Montant ({currency})
          </T>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.input} />

          <T v="caption" color={colors.textMuted}>
            Recevoir par
          </T>
          <View style={{ gap: 8 }}>
            {PAYOUT_METHODS.map((m) => (
              <Pressable key={m.key} onPress={() => setMethod(m.key)} style={[styles.method, method === m.key && { borderColor: colors.gold, backgroundColor: colors.goldSoft }]}>
                <View style={[styles.dot, { backgroundColor: m.tint }]} />
                <View style={{ flex: 1 }}>
                  <T v="bodyStrong">{m.label}</T>
                  <T v="caption" color={colors.textMuted}>
                    {m.hint}
                  </T>
                </View>
                {method === m.key && <Ionicons name="checkmark-circle" size={20} color={colors.gold} />}
              </Pressable>
            ))}
          </View>

          {kind === 'phone' && (
            <>
              <T v="caption" color={colors.textMuted}>
                Numéro {methodLabel(method)} (avec l’indicatif)
              </T>
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+221 77 123 45 67" placeholderTextColor={colors.textFaint} style={styles.input} />
            </>
          )}
          {kind === 'iban' && (
            <>
              <T v="caption" color={colors.textMuted}>
                Titulaire du compte
              </T>
              <TextInput value={name} onChangeText={setName} placeholder="Nom et prénom" placeholderTextColor={colors.textFaint} style={styles.input} />
              <T v="caption" color={colors.textMuted}>
                IBAN / RIB
              </T>
              <TextInput value={iban} onChangeText={setIban} autoCapitalize="characters" placeholder="FR76 …" placeholderTextColor={colors.textFaint} style={styles.input} />
            </>
          )}
          {kind === 'email' && (
            <>
              <T v="caption" color={colors.textMuted}>
                Courriel Interac
              </T>
              <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="vous@exemple.com" placeholderTextColor={colors.textFaint} style={styles.input} />
            </>
          )}

          {error && (
            <T v="small" color={colors.danger}>
              {error}
            </T>
          )}
          {busy ? <ActivityIndicator color={colors.gold} style={{ height: 56 }} /> : <Button title="Demander le retrait" icon="arrow-forward" onPress={submit} />}
          <T v="caption" color={colors.textFaint} style={{ textAlign: 'center' }}>
            Le montant est réservé tout de suite. L’équipe KiloFly envoie le virement, en général sous 48 h ouvrées.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tooLow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.borderGold, backgroundColor: colors.goldSoft },
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
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  sheet: { maxHeight: '92%', backgroundColor: colors.bgRaised, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.border },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
