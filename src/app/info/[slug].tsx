import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, BrandHeader, Card, T } from '@/components/ui';
import { INFO_PAGES, type InfoSlug } from '@/data/info';
import { colors } from '@/theme';

function QAItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen((o) => !o)} style={{ paddingVertical: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <T v="h3" style={{ flex: 1 }}>{q}</T>
        <T v="h3" color={colors.gold}>{open ? '−' : '+'}</T>
      </View>
      {open && (
        <T v="body" color={colors.textMuted} style={{ marginTop: 8 }}>
          {a}
        </T>
      )}
    </Pressable>
  );
}

export default function InfoPageScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = slug && slug in INFO_PAGES ? INFO_PAGES[slug as InfoSlug] : undefined;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <BrandHeader top={insets.top} art={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}>
          <BackButton />
          <T v="title" style={{ flex: 1 }}>{page?.title ?? 'Page introuvable'}</T>
        </View>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 20, gap: 14 }}>
        {!page ? (
          <T v="body" color={colors.textMuted}>Page introuvable</T>
        ) : (
          <>
            {page.intro && <T v="body" color={colors.textMuted}>{page.intro}</T>}
            {page.sections.map((s, i) => (
              <Card key={i}>
                <T v="h2" color={colors.gold} style={{ marginBottom: 8 }}>{s.heading}</T>
                {s.paragraphs?.map((p, j) => (
                  <T key={j} v="body" color={colors.text} style={{ marginBottom: 6 }}>{p}</T>
                ))}
                {s.bullets?.map((b, j) => (
                  <View key={j} style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                    <T v="body" color={colors.gold}>•</T>
                    <T v="body" color={colors.text} style={{ flex: 1 }}>{b}</T>
                  </View>
                ))}
                {s.qa?.map((item, j) => <QAItem key={j} q={item.q} a={item.a} />)}
              </Card>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}
