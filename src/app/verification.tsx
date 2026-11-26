// Identity verification: photo of an ID document + a selfie, reviewed by the KiloFly team.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmailVerifyCard } from '@/components/email-verify-card';
import { BackButton, BrandHeader, Button, Card, Chip, T, type IconName } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

type Status = { status: 'none' | 'pending' | 'verified' | 'rejected'; submitted_at: string | null; note: string | null };

const docTypes: [string, string][] = [
  ['id_card', "Carte d'identité"],
  ['passport', 'Passeport'],
  ['residence_permit', 'Titre de séjour'],
  ['driving_license', 'Permis de conduire'],
];

export default function Verification() {
  const insets = useSafeAreaInsets();
  const { session, profile, refreshProfile, loading } = useAuth();
  const [st, setSt] = useState<Status | null>(null);
  const [docType, setDocType] = useState('id_card');
  const [doc, setDoc] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selfie, setSelfie] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('my_identity_status');
    setSt(((data as Status[] | null) ?? [])[0] ?? { status: 'none', submitted_at: null, note: null });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace('/auth');
    else load();
  }, [loading, session, load]);

  async function pick(kind: 'doc' | 'selfie') {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    const opts: ImagePicker.ImagePickerOptions = { quality: 0.7, cameraType: kind === 'selfie' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back };
    const res = cam.granted ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled || !res.assets?.[0]) return;
    (kind === 'doc' ? setDoc : setSelfie)(res.assets[0]);
  }

  async function upload(asset: ImagePicker.ImagePickerAsset, name: string) {
    const ext = (asset.mimeType?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const path = `${session!.user.id}/${name}-${Date.now()}.${ext}`;
    const body = await (await fetch(asset.uri)).arrayBuffer();
    const { error: e } = await supabase.storage.from('id-documents').upload(path, body, { contentType: asset.mimeType || 'image/jpeg' });
    if (e) throw new Error(e.message);
    return path;
  }

  async function submit() {
    if (!doc || !selfie) return setError('Ajoutez la photo du document et votre selfie.');
    setError(null);
    setBusy(true);
    try {
      const [d, s] = await Promise.all([upload(doc, 'document'), upload(selfie, 'selfie')]);
      const { error: e } = await supabase.rpc('submit_identity', { p_document_path: d, p_selfie_path: s, p_document_type: docType });
      if (e) throw new Error(e.message);
      setDoc(null);
      setSelfie(null);
      await load();
      refreshProfile();
    } catch (e) {
      setError("L'envoi a échoué : " + (e as Error).message);
    }
    setBusy(false);
  }

  if (!session) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <BrandHeader top={insets.top} art={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}>
          <BackButton />
          <T v="title">Vérification</T>
        </View>
      </BrandHeader>

      <View style={{ paddingHorizontal: 16, marginTop: 20, gap: 14 }}>
        <T v="body" color={colors.textMuted}>
          Un profil vérifié inspire confiance : les expéditeurs choisissent plus facilement un voyageur avec le badge doré.
        </T>

        <Check icon="mail" label="Adresse e-mail" ok={!!profile?.email_verified} />
        {profile && !profile.email_verified && <EmailVerifyCard />}

        <Check
          icon="id-card"
          label="Pièce d'identité"
          ok={st?.status === 'verified'}
          pending={st?.status === 'pending'}
        />

        {!st ? (
          <ActivityIndicator color={colors.gold} />
        ) : st.status === 'verified' ? (
          <Card gold>
            <T v="bodyStrong">Votre identité est vérifiée ✅</T>
            <T v="small" color={colors.textMuted}>
              Le badge apparaît sur votre profil et vos annonces.
            </T>
          </Card>
        ) : st.status === 'pending' ? (
          <Card>
            <T v="bodyStrong">Documents en cours de vérification</T>
            <T v="small" color={colors.textMuted}>
              Notre équipe vérifie vos documents, en général sous 24 h. Vous recevrez une notification.
            </T>
          </Card>
        ) : (
          <>
            {st.status === 'rejected' && (
              <Card style={{ borderColor: colors.danger }}>
                <T v="bodyStrong" color={colors.danger}>
                  Vérification refusée
                </T>
                <T v="small" color={colors.textMuted}>
                  {st.note || 'Document illisible ou non conforme'}. Vous pouvez renvoyer vos documents.
                </T>
              </Card>
            )}
            <T v="caption" color={colors.textMuted}>
              Type de document
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {docTypes.map(([k, l]) => (
                <Chip key={k} label={l} active={docType === k} onPress={() => setDocType(k)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Shot label="Photo du document" hint="Recto, bien lisible" icon="card-outline" asset={doc} onPress={() => pick('doc')} />
              <Shot label="Selfie" hint="Visage bien éclairé" icon="person-circle-outline" asset={selfie} onPress={() => pick('selfie')} />
            </View>
            <T v="caption" color={colors.textFaint}>
              Vos documents sont privés : seuls vous et l'équipe KiloFly y avez accès. Ils ne sont jamais montrés aux autres utilisateurs.
            </T>
            {error && (
              <T v="small" color={colors.danger}>
                {error}
              </T>
            )}
            {busy ? <ActivityIndicator color={colors.gold} style={{ height: 56 }} /> : <Button title="Envoyer pour vérification" icon="shield-checkmark" onPress={submit} />}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Check({ icon, label, ok, pending }: { icon: IconName; label: string; ok: boolean; pending?: boolean }) {
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Ionicons name={icon} size={22} color={colors.gold} />
      <T v="bodyStrong" style={{ flex: 1 }}>
        {label}
      </T>
      <T v="caption" color={ok ? colors.success : pending ? colors.warning : colors.textMuted}>
        {ok ? 'Vérifié' : pending ? 'En cours' : 'Non vérifié'}
      </T>
    </Card>
  );
}

function Shot({ label, hint, icon, asset, onPress }: { label: string; hint: string; icon: IconName; asset: ImagePicker.ImagePickerAsset | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.shot}>
      {asset ? (
        <Image source={{ uri: asset.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <>
          <Ionicons name={icon} size={28} color={colors.gold} />
          <T v="small" style={{ textAlign: 'center' }}>
            {label}
          </T>
          <T v="caption" color={colors.textFaint} style={{ textAlign: 'center' }}>
            {hint}
          </T>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shot: {
    flex: 1,
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderGold,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
    overflow: 'hidden',
  },
});
