import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AdminScreen, confirm, Empty, ErrorBox, notify, SmallAction } from '@/components/admin-ui';
import { Card, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { shortDate } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

type Req = { user_id: string; full_name: string | null; email: string | null; document_path: string; selfie_path: string; document_type: string; submitted_at: string };

const docLabel: Record<string, string> = { id_card: "Carte d'identité", passport: 'Passeport', residence_permit: 'Titre de séjour', driving_license: 'Permis de conduire' };

export default function AdminVerification() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Req[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const { data, error: e } = await supabase.rpc('admin_list_identity_requests');
    if (e) setError(e.message);
    else setItems((data ?? []) as Req[]);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function review(r: Req, approve: boolean) {
    const ok = await confirm(approve ? "Valider l'identité ?" : 'Refuser ?', `${r.full_name || r.email} sera notifié.`);
    if (!ok) return;
    const reason = approve ? null : 'Document illisible ou ne correspondant pas au selfie';
    const { error: e } = await supabase.rpc('admin_review_identity', { p_user_id: r.user_id, p_approve: approve, p_reason: reason });
    if (e) notify(e.message);
    load();
  }

  return (
    <AdminScreen title="Vérification d'identité" onRefresh={load}>
      {!!error && <ErrorBox text={error} />}
      {items?.length === 0 && <Empty icon="shield-checkmark-outline" text="Aucune demande en attente." />}
      {items?.map((r) => (
        <Card key={r.user_id} style={{ gap: 10 }}>
          <View>
            <T v="h3">{r.full_name || 'Sans nom'}</T>
            <T v="small" color={colors.textMuted}>
              {r.email} · {docLabel[r.document_type] ?? r.document_type} · envoyé le {shortDate(r.submitted_at)}
            </T>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Signed path={r.document_path} label="Document" />
            <Signed path={r.selfie_path} label="Selfie" />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <SmallAction label="Refuser" icon="close" tone="danger" onPress={() => review(r, false)} />
            <SmallAction label="Valider" icon="checkmark" onPress={() => review(r, true)} />
          </View>
        </Card>
      ))}
    </AdminScreen>
  );
}

function Signed({ path, label }: { path: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [big, setBig] = useState(false);
  useEffect(() => {
    supabase.storage.from('id-documents').createSignedUrl(path, 600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);
  return (
    <Pressable onPress={() => setBig(!big)} style={[styles.img, big && { height: 360 }]}>
      {url && <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit={big ? 'contain' : 'cover'} />}
      <View style={styles.tag}>
        <T v="caption">{label}</T>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  img: { flex: 1, height: 150, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.cardHi },
  tag: { position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
});
