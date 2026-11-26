// "Mes alertes de trajet": be notified when a traveler publishes a trip on a route.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirm, notify } from '@/components/admin-ui';
import { BackButton, BrandHeader, Button, Card, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { createRouteAlert } from '@/lib/listings';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

type Alert = { id: string; departure: string; arrival: string; active: boolean; created_at: string };

export default function Alerts() {
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const [items, setItems] = useState<Alert[] | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('route_alerts')
      .select('id, departure, arrival, active, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as Alert[]);
  }, [session]);

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace('/auth');
    else load();
  }, [loading, session, load]);

  const add = async () => {
    if (from.trim().length < 2 || to.trim().length < 2) return notify('Indiquez une ville de départ et une ville d’arrivée.');
    setBusy(true);
    const r = await createRouteAlert(session!.user.id, from, to);
    setBusy(false);
    if (r.error) return notify(r.error);
    setFrom('');
    setTo('');
    load();
  };

  const toggle = async (a: Alert) => {
    setItems((prev) => prev?.map((x) => (x.id === a.id ? { ...x, active: !a.active } : x)) ?? null);
    const { error } = await supabase.from('route_alerts').update({ active: !a.active, updated_at: new Date().toISOString() }).eq('id', a.id);
    if (error) {
      notify(error.message);
      load();
    }
  };

  const remove = async (a: Alert) => {
    if (!(await confirm('Supprimer cette alerte ?', `${a.departure} → ${a.arrival}`))) return;
    const { error } = await supabase.from('route_alerts').delete().eq('id', a.id);
    if (error) notify(error.message);
    load();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
      <BrandHeader top={insets.top} art={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}>
          <BackButton />
          <T v="title">Mes alertes</T>
        </View>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 12 }}>
        <T v="body" color={colors.textMuted}>
          Recevez une notification dès qu’un voyageur publie un trajet sur l’une de vos routes.
        </T>

        <Card style={{ gap: 10 }}>
          <T v="bodyStrong">Nouvelle alerte</T>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput value={from} onChangeText={setFrom} placeholder="Départ" placeholderTextColor={colors.textFaint} style={styles.input} autoCapitalize="words" />
            <Ionicons name="arrow-forward" size={16} color={colors.gold} />
            <TextInput value={to} onChangeText={setTo} placeholder="Arrivée" placeholderTextColor={colors.textFaint} style={styles.input} autoCapitalize="words" />
          </View>
          {busy ? <ActivityIndicator color={colors.gold} /> : <Button title="Créer l’alerte" small leftIcon="notifications-outline" onPress={add} />}
        </Card>

        {!items ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} />
        ) : items.length === 0 ? (
          <T v="small" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 20 }}>
            Aucune alerte pour l’instant.
          </T>
        ) : (
          items.map((a) => (
            <Card key={a.id} style={styles.row}>
              <Ionicons name="airplane" size={18} color={a.active ? colors.gold : colors.textFaint} />
              <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/(tabs)/search', params: { from: a.departure, to: a.arrival } })}>
                <T v="bodyStrong" color={a.active ? colors.text : colors.textMuted}>
                  {a.departure} → {a.arrival}
                </T>
                <T v="caption" color={colors.textMuted}>
                  {a.active ? 'Active' : 'En pause'} · voir les voyages
                </T>
              </Pressable>
              <Switch value={a.active} onValueChange={() => toggle(a)} trackColor={{ true: colors.gold, false: colors.cardHi }} thumbColor={colors.text} />
              <Pressable onPress={() => remove(a)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
});
