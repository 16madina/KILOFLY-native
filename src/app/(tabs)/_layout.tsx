import { Ionicons } from '@expo/vector-icons';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tap, type IconName } from '@/components/ui';
import { colors, fonts } from '@/theme';

const items: Record<string, { label: string; icon: IconName; iconActive: IconName; dot?: boolean; badge?: number }> = {
  index: { label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
  tracking: { label: 'Suivi', icon: 'cube-outline', iconActive: 'cube', badge: 1 },
  messages: { label: 'Messages', icon: 'chatbox-ellipses-outline', iconActive: 'chatbox-ellipses', dot: true },
  post: { label: 'Annonces', icon: 'briefcase-outline', iconActive: 'briefcase' },
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
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              tap();
              if (!focused) navigateToTab(route.key);
            }}
            style={styles.item}>
            <View>
              <Ionicons name={focused ? item.iconActive : item.icon} size={26} color={tint} />
              {item.dot && <View style={styles.dot} />}
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
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tracking" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="post" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 6,
    backgroundColor: '#0C1A27',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontFamily: fonts.regular, fontSize: 12 },
  dot: { position: 'absolute', top: -2, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold, borderWidth: 2, borderColor: '#0C1A27' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#0C1A27',
  },
  badgeText: { color: colors.onGold, fontFamily: fonts.bold, fontSize: 9.5 },
});
