import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, BrandHeader, Card, T, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useNotifications, type AppNotification } from '@/lib/notifications';
import { colors } from '@/theme';

const iconFor = (n: AppNotification): IconName =>
  n.type.includes('payment') ? 'card' : n.type === 'warning' || n.type === 'error' ? 'alert-circle' : n.reservation_id ? 'cube' : n.conversation_id ? 'chatbubble' : 'notifications';

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  if (m < 1440) return `il y a ${Math.round(m / 60)} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { items, reload, markAllRead } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      reload().then(markAllRead);
    }, [reload, markAllRead]),
  );

  const open = (n: AppNotification) => {
    if (n.reservation_id) router.push({ pathname: '/reservation/[id]', params: { id: n.reservation_id } });
    else if (n.conversation_id) router.push({ pathname: '/conversation/[id]', params: { id: n.conversation_id } });
    else if (n.transport_request_id) router.push({ pathname: '/request/[id]', params: { id: n.transport_request_id } });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <BrandHeader top={insets.top} art={false} right={<View />}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}>
          <BackButton />
          <T v="title">Notifications</T>
        </View>
      </BrandHeader>
      <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 10 }}>
        {!session ? (
          <T v="body" color={colors.textMuted}>
            Connectez-vous pour voir vos notifications.
          </T>
        ) : !items ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={{ alignItems: 'center', gap: 10, marginTop: 50 }}>
            <Ionicons name="notifications-off-outline" size={36} color={colors.textFaint} />
            <T v="small" color={colors.textMuted}>
              Aucune notification pour l'instant.
            </T>
          </View>
        ) : (
          items.map((n) => (
            <Card key={n.id} onPress={() => open(n)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }} gold={!n.read}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={iconFor(n)} size={18} color={colors.goldBright} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T v="bodyStrong">{n.title}</T>
                <T v="small" color={colors.textMuted}>
                  {n.message}
                </T>
                <T v="caption" color={colors.textFaint}>
                  {ago(n.created_at)}
                </T>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
