import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, BackButton, BrandHeader, Button, T, tap, type IconName } from '@/components/ui';
import { initialsOf, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius } from '@/theme';

const types: [string, string][] = [
  ['traveler', 'Voyageur'],
  ['shipper', 'Expéditeur'],
  ['professional', 'Professionnel'],
];

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const { session, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [userType, setUserType] = useState('traveler');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setPhone(profile.phone ?? '');
    setCity(profile.city ?? '');
    setCountry(profile.country ?? '');
    setBio(profile.bio ?? '');
    setUserType(profile.user_type ?? 'traveler');
    setAvatar(profile.avatar_url || null);
  }, [profile]);

  if (!session) return <Redirect href="/auth" />;

  const pickAvatar = async () => {
    tap();
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setUploading(true);
    setMessage(null);
    try {
      const ext = (asset.mimeType?.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
      const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
      const body = await fetch(asset.uri).then((r) => r.arrayBuffer());
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, body, { contentType: asset.mimeType ?? 'image/jpeg', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const r = await updateProfile({ avatar_url: data.publicUrl });
      if (r.error) throw new Error(r.error);
      setAvatar(data.publicUrl);
      setMessage({ ok: true, text: 'Photo mise à jour.' });
    } catch (e) {
      setMessage({ ok: false, text: `La photo n’a pas pu être envoyée. ${(e as Error).message ?? ''}` });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setMessage(null);
    if (fullName.trim().length < 2) return setMessage({ ok: false, text: 'Renseignez votre nom complet.' });
    setBusy(true);
    const r = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      country: country.trim(),
      bio: bio.trim(),
      user_type: userType,
    });
    setBusy(false);
    if (r.error) return setMessage({ ok: false, text: r.error });
    setMessage({ ok: true, text: 'Profil enregistré.' });
    setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')), 600);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <BrandHeader top={insets.top} art={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}>
            <BackButton />
            <T v="title">Mon profil</T>
          </View>
        </BrandHeader>

        <View style={{ paddingHorizontal: 16, marginTop: 22, gap: 14 }}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Pressable onPress={pickAvatar} disabled={uploading}>
              <Avatar photo={avatar ? { uri: avatar } : undefined} initials={initialsOf(fullName)} size={112} ring />
              <View style={styles.camera}>
                {uploading ? <ActivityIndicator size="small" color={colors.onGold} /> : <Ionicons name="camera" size={18} color={colors.onGold} />}
              </View>
            </Pressable>
            <T v="small" color={colors.gold}>
              Changer la photo
            </T>
          </View>

          <Field icon="person-outline" label="Nom complet" value={fullName} onChange={setFullName} autoCapitalize="words" />
          <Field icon="call-outline" label="Téléphone" value={phone} onChange={setPhone} keyboard="phone-pad" placeholder="+33 6 12 34 56 78" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field icon="business-outline" label="Ville" value={city} onChange={setCity} autoCapitalize="words" />
            </View>
            <View style={{ flex: 1 }}>
              <Field icon="flag-outline" label="Pays" value={country} onChange={setCountry} autoCapitalize="words" />
            </View>
          </View>
          <Field icon="chatbox-ellipses-outline" label="À propos de moi" value={bio} onChange={setBio} multiline placeholder="Vos trajets habituels, vos disponibilités…" />

          <View>
            <T v="caption" color={colors.textMuted} style={{ marginBottom: 8 }}>
              Je suis surtout
            </T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {types.map(([k, label]) => (
                <Pressable key={k} onPress={() => (tap(), setUserType(k))} style={[styles.type, userType === k && styles.typeActive]}>
                  <T v="small" color={userType === k ? colors.goldBright : colors.text}>
                    {label}
                  </T>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.readonly}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <T v="small" color={colors.textMuted} style={{ flex: 1 }}>
              {session.user.email}
            </T>
          </View>

          {message && (
            <T v="small" color={message.ok ? colors.success : colors.danger} style={{ textAlign: 'center' }}>
              {message.text}
            </T>
          )}

          {busy ? (
            <ActivityIndicator color={colors.gold} style={{ height: 56 }} />
          ) : (
            <Button title="Enregistrer" icon="checkmark" onPress={save} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  keyboard,
  autoCapitalize = 'sentences',
  multiline,
}: {
  icon: IconName;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  multiline?: boolean;
}) {
  return (
    <View>
      <T v="caption" color={colors.textMuted} style={{ marginBottom: 6 }}>
        {label}
      </T>
      <View style={[styles.field, multiline && { height: 100, alignItems: 'flex-start', paddingTop: 14 }]}>
        <Ionicons name={icon} size={19} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType={keyboard}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          style={[styles.input, multiline && { textAlignVertical: 'top', height: 76 }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.field,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, minWidth: 0 },
  type: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgRaised,
  },
  typeActive: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  readonly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
