import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, T, type IconName } from '@/components/ui';
import { colors } from '@/theme';

/** Shown in place of account-only content when browsing as a guest. */
export function SignInPrompt({ icon = 'lock-closed-outline', text }: { icon?: IconName; text: string }) {
  return (
    <Card gold style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          borderWidth: 1.2,
          borderColor: colors.borderGold,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name={icon} size={26} color={colors.gold} />
      </View>
      <T v="body" color={colors.textMuted} style={{ textAlign: 'center', maxWidth: 280 }}>
        {text}
      </T>
      <Button title="Se connecter" small icon="arrow-forward" onPress={() => router.push({ pathname: '/auth', params: { mode: 'login' } })} />
      <Button title="Créer un compte" small variant="outline" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })} />
    </Card>
  );
}

/** Push to `href` when signed in, otherwise to the sign-in screen. */
export function requireAuth(signedIn: boolean, go: () => void) {
  if (signedIn) go();
  else router.push({ pathname: '/auth', params: { mode: 'login' } });
}
