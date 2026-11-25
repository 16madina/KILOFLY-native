import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { unreadCount } from '@/components/messages-list';
import { tap, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, fonts, gradients, shadow } from '@/theme';

// Accueil · Recherche · (+) Annonces · Suivi (colis + messages) · Profil
const items: Record<string, { label: string; icon: IconName; iconActive: IconName; badge?: number; center?: boolean }> = {
  index: { label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
  search: { label: 'Recherche', icon: 'search-outline', iconActive: 'search' },
  post: { label: 'Annonces', icon: 'add', iconActive: 'add', center: true },
  tracking: { label: 'Suivi', icon: 'cube-outline', iconActive: 'cube', badge: 1 + unreadCount },
  profile: { label: 'Profil', icon: 'person-outline', iconActive: 'person' },
};

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {state.routes.map((route, i) => {
        const item = items[route.name];
        if (!item) return null;
        const focused = state.index === i;
        const tint = focused ? colors.gold : colors.text;
        const onPress = () => {
          tap();
          if (!focused) navigateToTab(route.key);
        };

        if (item.center) {
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item}>
              <View style={styles.fabRing}>
                <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
                  <Ionicons name="add" size={32} color={colors.onGold} />
                </LinearGradient>
              </View>
              <Text style={[styles.label, { color: tint }, focused && { fontFamily: fonts.semibold }]}>{item.label}</Text>
            </Pressable>
          );
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item}>
            <View>
              <Ionicons name={focused ? item.iconActive : item.icon} size={26} color={tint} />
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color: tint }, focused && { fontFamily: fonts.semibold }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { session, guest, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  // First launch without an account: show the welcome screen (unless they chose "Passer").
  if (!session && !guest) return <Redirect href="/welcome" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="post" />
      <Tabs.Screen name="tracking" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const BAR = '#0C1A27';

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    paddingHorizontal: 6,
    backgroundColor: BAR,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontFamily: fonts.regular, fontSize: 12 },
  fabRing: { marginTop: -34, padding: 5, borderRadius: 36, backgroundColor: BAR },
  fab: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', ...shadow.gold },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: BAR,
  },
  badgeText: { color: colors.onGold, fontFamily: fonts.bold, fontSize: 9.5 },
});
