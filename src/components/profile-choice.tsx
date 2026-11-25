import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { art, Button, Card, T, type IconName } from '@/components/ui';
import { colors } from '@/theme';

const choices: {
  key: string;
  icon: IconName;
  title: string;
  text: string;
  cta: string;
  image: number;
  outline?: boolean;
  inline?: boolean;
}[] = [
  {
    key: 'traveler',
    icon: 'airplane-outline',
    title: 'Je voyage',
    text: 'Je profite de mes déplacements pour transporter des colis et gagner un revenu supplémentaire.',
    cta: 'Devenir voyageur',
    image: art.traveler,
  },
  {
    key: 'sender',
    icon: 'cube-outline',
    title: 'J’envoie un colis',
    text: 'J’expédie mes colis en toute simplicité avec des voyageurs de confiance, partout dans le monde.',
    cta: 'Envoyer un colis',
    image: art.parcel,
  },
  {
    key: 'pro',
    icon: 'bus-outline',
    title: 'Transporteur / transitaire',
    text: 'Je suis un professionnel du transport et je souhaite proposer des capacités de livraison sur KiloFly.',
    cta: 'Accès professionnel',
    image: art.pro,
    outline: true,
    inline: true,
  },
];

/** The three profile cards ("Je voyage", "J'envoie un colis", "Transporteur"). */
export function ProfileChoices({ onChoose }: { onChoose: (key: string) => void }) {
  return (
    <View style={{ gap: 14 }}>
      {choices.map((c) => (
        <Card key={c.key} style={styles.card}>
          <View style={styles.imageWrap}>
            <Image source={c.image} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['#111E2E', 'rgba(17,30,46,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 0 }} style={StyleSheet.absoluteFill} />
          </View>
          <View style={{ maxWidth: '72%' }}>
            <View style={{ flexDirection: c.inline ? 'row' : 'column', alignItems: c.inline ? 'center' : 'flex-start', gap: c.inline ? 10 : 6 }}>
              <Ionicons name={c.icon} size={c.inline ? 26 : 32} color={colors.gold} />
              <T v={c.inline ? 'h2' : 'title'}>{c.title}</T>
            </View>
            <T v="small" color={colors.textMuted} style={{ marginTop: 6, lineHeight: 19 }}>
              {c.text}
            </T>
          </View>
          <Button
            title={c.cta}
            icon="arrow-forward"
            small
            variant={c.outline ? 'outline' : 'gold'}
            onPress={() => onChoose(c.key)}
            style={{ alignSelf: 'flex-start', marginTop: 14, minWidth: 210 }}
          />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, minHeight: 200 },
  imageWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '52%' },
});
