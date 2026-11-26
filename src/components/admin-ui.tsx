// Shared pieces for the admin screens.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, BrandHeader, T, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, fonts } from '@/theme';

/** Screen frame for admin pages. Sends non-admins away. */
export function AdminScreen({ title, children, onRefresh }: { title: string; children: ReactNode; onRefresh?: () => void }) {
  const insets = useSafeAreaInsets();
  const { session, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace('/auth');
  }, [loading, session]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <BrandHeader top={insets.top} art={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22 }}>
          <BackButton />
          <View style={{ flex: 1 }}>
            <T v="label" color={colors.gold}>
              Administration
            </T>
            <T v="title">{title}</T>
          </View>
          {onRefresh && (
            <Pressable onPress={onRefresh} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name="refresh" size={20} color={colors.goldBright} />
            </Pressable>
          )}
        </View>
      </BrandHeader>
      <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 12 }}>
        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        ) : !isAdmin ? (
          <Empty icon="lock-closed-outline" text="Cette page est réservée aux administrateurs." />
        ) : (
          children
        )}
      </View>
    </ScrollView>
  );
}

export function Empty({ icon = 'file-tray-outline', text }: { icon?: IconName; text: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 40 }}>
      <Ionicons name={icon} size={34} color={colors.textFaint} />
      <T v="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
        {text}
      </T>
    </View>
  );
}

export function ErrorBox({ text }: { text: string }) {
  return (
    <View style={[styles.box, { borderColor: colors.danger, backgroundColor: colors.dangerSoft }]}>
      <T v="small" color={colors.danger}>
        {text}
      </T>
    </View>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        style={{ flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 0 }}
      />
    </View>
  );
}

export function Badge({ label, tone = 'muted' }: { label: string; tone?: 'gold' | 'success' | 'danger' | 'warning' | 'muted' }) {
  const map = {
    gold: [colors.goldSoft, colors.goldBright],
    success: [colors.successSoft, colors.success],
    danger: [colors.dangerSoft, colors.danger],
    warning: [colors.warningSoft, colors.warning],
    muted: ['rgba(255,255,255,0.06)', colors.textMuted],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
      <T v="caption" color={fg} style={{ fontSize: 11 }}>
        {label}
      </T>
    </View>
  );
}

export function SmallAction({ label, icon, tone = 'gold', onPress }: { label: string; icon: IconName; tone?: 'gold' | 'danger'; onPress: () => void }) {
  const fg = tone === 'danger' ? colors.danger : colors.goldBright;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, { borderColor: fg }, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={15} color={fg} />
      <T v="caption" color={fg}>
        {label}
      </T>
    </Pressable>
  );
}

/** Yes/no confirmation that works on phone and web. */
export function confirm(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirmer', style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export function notify(message: string) {
  if (Platform.OS === 'web') window.alert(message);
  else Alert.alert('KiloFly', message);
}

const styles = StyleSheet.create({
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  box: { borderWidth: 1, borderRadius: 12, padding: 12 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
});
