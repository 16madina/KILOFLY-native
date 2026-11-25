import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileChoices } from '@/components/profile-choice';
import { requireAuth } from '@/components/sign-in-prompt';
import { TicketCard } from '@/components/ticket-card';
import { AccentTitle, BrandHeader, SectionHeader, T } from '@/components/ui';
import { listings } from '@/data/mock';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function Announcements() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <BrandHeader top={insets.top}>
        <AccentTitle before="Publier une " accent="annonce" style={{ marginTop: 36 }} />
        <T v="body" color={colors.textMuted} style={{ marginTop: 6, maxWidth: 250 }}>
          Proposez vos kilos libres ou trouvez un voyageur pour votre colis.
        </T>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <ProfileChoices onChoose={() => requireAuth(!!session, () => router.push('/post-listing'))} />
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 30 }}>
        <SectionHeader title="Mes annonces" action="Tout voir" />
        <TicketCard listing={listings[2]} />
      </View>
    </ScrollView>
  );
}
