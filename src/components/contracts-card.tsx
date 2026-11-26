// Shows the signed engagements on a reservation (both parties), with each signature.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Button, Card, T } from '@/components/ui';
import { getContracts, type SignedContract } from '@/lib/contract';
import { notify } from '@/components/admin-ui';
import { emailDocument, shareDocument } from '@/lib/documents';
import { colors } from '@/theme';

const when = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function ContractsCard({ reservationId }: { reservationId: string }) {
  const [items, setItems] = useState<SignedContract[]>([]);
  const [open, setOpen] = useState<SignedContract | null>(null);

  useEffect(() => {
    getContracts(reservationId).then(setItems);
  }, [reservationId]);

  if (items.length === 0) return null;
  return (
    <Card style={{ gap: 8 }}>
      <T v="caption" color={colors.textMuted}>
        Engagements signés
      </T>
      {items.map((c) => (
        <Pressable key={c.signature_type} onPress={() => setOpen(c)} style={styles.row}>
          <Ionicons name="document-text-outline" size={20} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <T v="bodyStrong">{c.signature_type === 'sender' ? 'Expéditeur' : 'Voyageur'} · {c.signer_name ?? ''}</T>
            <T v="caption" color={colors.textMuted}>
              Signé le {when(c.signed_at)}
            </T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Pressable>
      ))}

      <Modal visible={!!open} animationType="slide" transparent onRequestClose={() => setOpen(null)}>
        <View style={styles.back}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ padding: 18, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <T v="h2" style={{ flex: 1 }}>
                {open?.terms.title}
              </T>
              <Pressable onPress={() => setOpen(null)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            {open?.terms.clauses.map((c, i) => (
              <T key={i} v="small" color={colors.textMuted}>
                • {c}
              </T>
            ))}
            <View style={styles.sig}>{open && <SvgXml xml={open.signature_svg} width="100%" height="100%" />}</View>
            <T v="caption" color={colors.textFaint}>
              {open?.signer_name} · {open && when(open.signed_at)} · version {open?.terms.version}
            </T>
            {open && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Button
                  title="PDF"
                  small
                  leftIcon="download-outline"
                  style={{ flex: 1 }}
                  onPress={async () => {
                    const r = await shareDocument('contract', reservationId, open.signature_type);
                    if (r.error) notify(r.error);
                  }}
                />
                <Button
                  title="Par courriel"
                  small
                  variant="outline"
                  leftIcon="mail-outline"
                  style={{ flex: 1 }}
                  onPress={async () => {
                    const r = await emailDocument('contract', reservationId, open.signature_type);
                    notify(r.error ?? `Envoyé à ${r.email}.`);
                  }}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', backgroundColor: colors.bgRaised, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sig: { height: 150, borderRadius: 12, backgroundColor: '#F7F3EA', overflow: 'hidden', marginTop: 8 },
});
