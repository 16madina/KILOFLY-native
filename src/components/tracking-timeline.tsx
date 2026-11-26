// Real package timeline: dates, places, notes, delivery photo and recipient signature.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator, Modal, Pressable, Share, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Button, Card, T } from '@/components/ui';
import { eventLabel, getDeliveryCode, photoUrl, reachedStep, signatureSvg, timeline, TRAVELER_STEPS, type TrackingEvent } from '@/lib/tracking';
import { colors, fonts } from '@/theme';

const when = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function TrackingTimeline({ events, paid }: { events: TrackingEvent[]; paid: boolean }) {
  const done = timeline(events);
  const reached = reachedStep(events);
  const upcoming = paid ? TRAVELER_STEPS.filter((_, i) => i + 1 > reached && !done.some((e) => e.status === TRAVELER_STEPS[i].key)) : [];

  return (
    <Card>
      <T v="h2" style={{ marginBottom: 14 }}>
        Suivi du colis
      </T>
      {done.map((e, i) => (
        <Row key={e.id} last={i === done.length - 1 && upcoming.length === 0} done>
          <T v="bodyStrong">{eventLabel(e.status)}</T>
          <T v="caption" color={colors.textMuted}>
            {when(e.created_at)}
            {e.location_name ? ` · ${e.location_name}` : ''}
          </T>
          {!!e.description && e.description !== eventLabel(e.status) && !e.is_automatic && (
            <T v="small" color={colors.textMuted} style={{ marginTop: 2 }}>
              {e.description}
            </T>
          )}
          {(e.photo_path || e.has_signature) && <Proof event={e} />}
        </Row>
      ))}
      {upcoming.map((s, i) => (
        <Row key={s.key} last={i === upcoming.length - 1}>
          <T v="body" color={colors.textFaint}>
            {s.label}
          </T>
        </Row>
      ))}
    </Card>
  );
}

function Row({ children, done, last }: { children: React.ReactNode; done?: boolean; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={[styles.node, done && styles.nodeDone]}>{done && <Ionicons name="checkmark" size={13} color={colors.onGold} />}</View>
        {!last && <View style={[styles.line, done && { backgroundColor: colors.gold }]} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 16, gap: 1 }}>{children}</View>
    </View>
  );
}

function Proof({ event }: { event: TrackingEvent }) {
  const [img, setImg] = useState<string | null>(null);
  const [sig, setSig] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (event.photo_path) photoUrl(event.photo_path).then(setImg);
    if (event.has_signature) signatureSvg(event.id).then(setSig);
  }, [event]);

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
      {event.photo_path && (
        <Pressable onPress={() => setOpen(true)} style={styles.thumb}>
          {img ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <ActivityIndicator color={colors.gold} />}
        </Pressable>
      )}
      {event.has_signature && (
        <View style={[styles.thumb, { backgroundColor: '#F7F3EA', width: 120 }]}>
          {sig ? <SvgXml xml={sig} width="100%" height="100%" /> : <ActivityIndicator color={colors.gold} />}
        </View>
      )}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.viewer} onPress={() => setOpen(false)}>
          {img && <Image source={{ uri: img }} style={{ width: '100%', height: '80%' }} contentFit="contain" />}
        </Pressable>
      </Modal>
    </View>
  );
}

/** Sender side: the code to give to whoever receives the parcel. */
export function DeliveryCodeCard({
  reservationId,
  delivered,
  from,
  to,
  traveler,
}: {
  reservationId: string;
  delivered: boolean;
  from?: string;
  to?: string;
  traveler?: string;
}) {
  const [code, setCode] = useState<string | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const message = (c: string) =>
    `📦 KiloFly : ton colis${from && to ? ` ${from} → ${to}` : ''} arrive${traveler ? ` avec ${traveler}` : ''}.\n\n` +
    `Code de livraison : ${c}\n\n` +
    `Donne ce code au voyageur seulement quand tu as le colis entre les mains et que tout est en ordre. Ne le donne à personne d'autre.`;

  const share = async () => {
    if (!code) return;
    try {
      await Share.share({ message: message(code) });
    } catch {
      // closed
    }
  };
  const copy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  useEffect(() => {
    getDeliveryCode(reservationId).then(setCode);
  }, [reservationId]);
  if (code === null) return null;
  return (
    <Card gold style={{ alignItems: 'center', gap: 6 }}>
      <T v="label" color={colors.gold}>
        Code de livraison
      </T>
      {code === undefined ? (
        <ActivityIndicator color={colors.gold} />
      ) : (
        <T v="display" style={{ letterSpacing: 8, fontFamily: fonts.bold }}>
          {code}
        </T>
      )}
      <T v="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
        {delivered
          ? 'Ce code a servi à confirmer la livraison.'
          : 'Donnez ce code à la personne qui recevra le colis. Le voyageur le lui demandera à la remise : sans ce code, il ne peut pas valider la livraison.'}
      </T>
      {!delivered && !!code && (
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 6 }}>
          <Button title="Envoyer" small leftIcon="share-social-outline" onPress={share} style={{ flex: 1.3 }} />
          <Button title={copied ? 'Copié ✓' : 'Copier'} small variant="outline" leftIcon="copy-outline" onPress={copy} style={{ flex: 1 }} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  node: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  nodeDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  thumb: { width: 84, height: 84, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.cardHi, alignItems: 'center', justifyContent: 'center' },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 16 },
});
