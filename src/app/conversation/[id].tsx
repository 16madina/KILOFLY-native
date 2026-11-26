// Real-time chat between a sender and a traveler, about one trip.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirm, notify } from '@/components/admin-ui';
import { Avatar, BackButton, T, tap, VerifiedBadge } from '@/components/ui';
import { initialsOf, useAuth } from '@/lib/auth';
import { cityCode } from '@/lib/cities';
import { shortDate } from '@/lib/listings';
import { blockUser, useChat, useConversations, type Message } from '@/lib/messages';
import { colors, fonts, radius } from '@/theme';

const time = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const t = new Date();
  if (d.toDateString() === t.toDateString()) return 'Aujourd’hui';
  if (d.toDateString() === new Date(t.getTime() - 864e5).toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

type Row = { kind: 'day'; key: string; label: string } | { kind: 'msg'; key: string; m: Message };

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();
  const { items, reload } = useConversations();
  const c = items?.find((x) => x.id === id);
  const { messages, send } = useChat(id);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const list = useRef<FlatList<Row>>(null);
  const me = session?.user.id;

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let day = '';
    for (const m of messages ?? []) {
      const d = new Date(m.created_at).toDateString();
      if (d !== day) {
        day = d;
        out.push({ kind: 'day', key: `d-${d}`, label: dayLabel(m.created_at) });
      }
      out.push({ kind: 'msg', key: m.id, m });
    }
    return out;
  }, [messages]);

  useEffect(() => {
    if (!loading && !session) router.replace('/auth');
  }, [loading, session]);

  useEffect(() => {
    if (rows.length) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 60);
  }, [rows.length]);

  const onSend = async () => {
    if (!text.trim()) return;
    tap();
    setError(null);
    const draft = text;
    setText('');
    const err = await send(draft);
    if (err) {
      setError(err);
      setText(draft);
    }
  };

  const menu = async () => {
    if (!c) return;
    const ok = await confirm(
      c.blocked ? 'Débloquer ?' : `Bloquer ${c.other_name ?? 'cet utilisateur'} ?`,
      c.blocked ? 'Vous pourrez de nouveau échanger des messages.' : 'Vous ne recevrez plus ses messages et cette personne ne pourra plus vous écrire.',
    );
    if (!ok) return;
    const r = await blockUser(c.other_id, !c.blocked);
    if (r.error) notify(r.error);
    reload();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <BackButton />
        <Avatar photo={c?.other_avatar ? { uri: c.other_avatar } : undefined} initials={initialsOf(c?.other_name ?? '?')} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <T v="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
              {c?.other_name ?? ' '}
            </T>
            {c?.other_verified && <VerifiedBadge size={15} />}
          </View>
          {!!c?.departure && (
            <Pressable onPress={() => router.push({ pathname: '/listing/[id]', params: { id: c.listing_id } })}>
              <T v="caption" color={colors.gold} numberOfLines={1}>
                ✈ {c.departure} ({cityCode(c.departure)}) → {c.arrival} ({cityCode(c.arrival)}) · {shortDate(c.departure_date)}
              </T>
            </Pressable>
          )}
        </View>
        <Pressable onPress={menu} hitSlop={10} style={styles.more}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
        </Pressable>
      </View>

      {!messages ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40, flex: 1 }} />
      ) : (
        <FlatList
          ref={list}
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={{ padding: 14, gap: 8, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.safety}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.gold} />
              <T v="caption" color={colors.textMuted} style={{ flex: 1 }}>
                Pour votre sécurité, réservez et payez toujours dans KiloFly. Ne partagez jamais vos codes ni vos coordonnées bancaires.
              </T>
            </View>
          }
          ListEmptyComponent={
            <T v="small" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 30 }}>
              Écrivez votre premier message : poids, contenu du colis, lieu de remise…
            </T>
          }
          renderItem={({ item }) =>
            item.kind === 'day' ? (
              <View style={styles.day}>
                <T v="caption" color={colors.textMuted}>
                  {item.label}
                </T>
              </View>
            ) : (
              <Bubble m={item.m} mine={item.m.sender_id === me} />
            )
          }
        />
      )}

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {error && (
          <T v="caption" color={colors.danger} style={{ marginBottom: 6 }}>
            {error}
          </T>
        )}
        {c?.blocked ? (
          <T v="small" color={colors.textMuted} style={{ textAlign: 'center', paddingVertical: 10 }}>
            Cette discussion est bloquée.
          </T>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Votre message…"
              placeholderTextColor={colors.textFaint}
              multiline
              maxLength={2000}
              style={styles.input}
            />
            <Pressable onPress={onSend} disabled={!text.trim()} style={[styles.send, !text.trim() && { opacity: 0.4 }]}>
              <Ionicons name="send" size={18} color={colors.onGold} />
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ m, mine }: { m: Message; mine: boolean }) {
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <T v="body" color={mine ? colors.onGold : colors.text} style={{ lineHeight: 21 }}>
        {m.content}
      </T>
      <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 4, marginTop: 2 }}>
        <T v="caption" color={mine ? 'rgba(20,17,11,0.65)' : colors.textFaint} style={{ fontSize: 11 }}>
          {time(m.created_at)}
        </T>
        {mine && <Ionicons name={m.pending ? 'time-outline' : m.read ? 'checkmark-done' : 'checkmark'} size={14} color={m.read ? '#1E6FD9' : 'rgba(20,17,11,0.65)'} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgRaised,
  },
  more: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  safety: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10, borderRadius: radius.md, backgroundColor: colors.goldSoft, marginBottom: 6 },
  day: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.card, marginVertical: 6 },
  bubble: { maxWidth: '80%', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.gold, borderBottomRightRadius: 6 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: colors.border },
  composer: { paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgRaised },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
});
