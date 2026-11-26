import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useUnreadCount } from '@/lib/notifications';
import { colors, fonts, gradients, radius, shadow } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const art = {
  window: require('@/assets/art/hero-window.png'),
  traveler: require('@/assets/art/card-traveler.png'),
  parcel: require('@/assets/art/card-parcel.png'),
  pro: require('@/assets/art/card-pro.png'),
  box: require('@/assets/art/parcel-box.png'),
  mark: require('@/assets/brand/logo-k.png'),
  wordmark: require('@/assets/brand/wordmark.png'),
};

/* ---------- Typography ---------- */

type Variant = 'display' | 'title' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'caption' | 'label';

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 40 },
  title: { fontFamily: fonts.serif, fontSize: 27, lineHeight: 33 },
  h2: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 27 },
  h3: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.medium, fontSize: 10.5, lineHeight: 14, letterSpacing: 2.6, textTransform: 'uppercase' },
};

export function T({
  v = 'body',
  color = colors.text,
  italic,
  style,
  ...rest
}: TextProps & { v?: Variant; color?: string; italic?: boolean }) {
  return <Text {...rest} style={[variants[v], { color }, italic && { fontFamily: fonts.serifItalic }, style]} />;
}

/** Serif title with a gold italic accent, e.g. "Envoyez vos colis avec *des voyageurs*" */
export function AccentTitle({ before, accent, after, v = 'display', style }: { before?: string; accent: string; after?: string; v?: Variant; style?: StyleProp<TextStyle> }) {
  return (
    <T v={v} style={style}>
      {before}
      <T v={v} italic color={colors.gold}>
        {accent}
      </T>
      {after}
    </T>
  );
}

/* ---------- Brand ---------- */

export function Logo({ size = 30, tagline, center }: { size?: number; tagline?: string | false; center?: boolean }) {
  return (
    <View style={{ alignItems: center ? 'center' : 'flex-start' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Image source={art.mark} style={{ width: size * 1.6, height: size * 1.15 }} contentFit="contain" />
        <Image source={art.wordmark} style={{ width: size * 1.3 * 3.33, height: size * 1.3 }} contentFit="contain" />
      </View>
      {tagline !== false && (
        <View style={styles.taglineRow}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>{tagline ?? 'Expédiez malin, voyagez utile'}</Text>
          <View style={styles.taglineLine} />
        </View>
      )}
    </View>
  );
}

/** Top header used on most screens: logo, tagline, bell, and the window+suitcase art on the right. */
export function BrandHeader({
  top,
  children,
  art: showArt = true,
  right,
  tagline,
}: {
  top: number;
  children?: ReactNode;
  art?: boolean;
  right?: ReactNode;
  tagline?: string;
}) {
  return (
    <View style={{ paddingTop: top + 10, paddingHorizontal: 20, overflow: 'hidden' }}>
      {showArt && (
        <View pointerEvents="none" style={styles.headerArt}>
          <Image source={art.window} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="right" />
          <LinearGradient colors={[colors.bg, 'rgba(3,15,30,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.55, y: 0 }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(3,15,30,0)', colors.bg]} start={{ x: 0, y: 0.55 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Logo size={28} tagline={tagline} />
        {right ?? <NotificationBell />}
      </View>
      {children}
    </View>
  );
}

/** Header bell: opens the notifications list, dot only when something is unread. */
function NotificationBell() {
  const unread = useUnreadCount();
  return <IconButton icon="notifications-outline" badge={unread > 0} onPress={() => router.push('/notifications')} />;
}

/* ---------- Surfaces ---------- */

export function Card({
  children,
  style,
  onPress,
  gold,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  gold?: boolean;
}) {
  const inner = (
    <>
      <LinearGradient colors={gradients.card} style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]} />
      {children}
    </>
  );
  const base = [styles.card, gold && { borderColor: colors.borderGold }, style];
  if (!onPress) return <View style={base}>{inner}</View>;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [...base, pressed && { transform: [{ scale: 0.985 }], opacity: 0.95 }]}>
      {inner}
    </Pressable>
  );
}

/* ---------- Buttons ---------- */

export function Button({
  title,
  onPress,
  icon,
  leftIcon,
  variant = 'gold',
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  leftIcon?: IconName;
  variant?: 'gold' | 'outline' | 'dark';
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const fg = variant === 'gold' ? colors.onGold : variant === 'outline' ? colors.goldBright : colors.text;
  const h = small ? 44 : 56;
  const content = (
    <View style={[styles.btnInner, { height: h }]}>
      {leftIcon && <Ionicons name={leftIcon} size={small ? 18 : 22} color={fg} />}
      <Text style={{ fontFamily: fonts.semibold, fontSize: small ? 15 : 18, color: fg }}>{title}</Text>
      {icon && <Ionicons name={icon} size={small ? 18 : 22} color={fg} />}
    </View>
  );
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        { borderRadius: h / 2 },
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.gold },
        variant === 'dark' && { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.bgRaised },
        variant === 'gold' && shadow.gold,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 },
        style,
      ]}>
      {variant === 'gold' ? (
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: h / 2 }}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  badge,
  style,
  size = 46,
}: {
  icon: IconName;
  onPress?: () => void;
  badge?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: number;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [styles.iconBtn, { width: size, height: size }, pressed && { transform: [{ scale: 0.92 }] }, style]}>
      <Ionicons name={icon} size={size * 0.48} color={colors.text} />
      {badge && <View style={styles.dot} />}
    </Pressable>
  );
}

export function BackButton() {
  return <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}

/* ---------- Identity ---------- */

export function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <View style={[styles.verified, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="checkmark" size={size * 0.68} color={colors.onGold} />
    </View>
  );
}

export function Avatar({
  photo,
  initials,
  size = 48,
  ring,
  verified,
}: {
  photo?: ImageSource | number;
  initials: string;
  size?: number;
  ring?: boolean;
  verified?: boolean;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          borderWidth: ring ? 2.5 : 1,
          borderColor: ring ? colors.gold : colors.borderStrong,
          backgroundColor: colors.cardHi,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {photo ? (
          <Image source={photo} style={{ width: '112%', height: '112%' }} contentFit="cover" />
        ) : (
          <Text style={{ color: colors.gold, fontFamily: fonts.serif, fontSize: size * 0.38 }}>{initials}</Text>
        )}
      </View>
      {verified && (
        <View style={{ position: 'absolute', right: -2, bottom: -2 }}>
          <VerifiedBadge size={Math.max(16, size * 0.28)} />
        </View>
      )}
    </View>
  );
}

export function Stars({ rating, reviews, size = 'small' }: { rating: number; reviews?: number; size?: 'small' | 'large' }) {
  const large = size === 'large';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Ionicons name="star" size={large ? 18 : 14} color={colors.gold} />
      <T v={large ? 'bodyStrong' : 'small'} style={{ fontFamily: fonts.semibold }}>
        {rating.toFixed(1).replace('.', ',')}
      </T>
      {reviews !== undefined && (
        <T v={large ? 'body' : 'small'} color={colors.textMuted}>
          ({reviews}
          {large ? ' avis' : ''})
        </T>
      )}
    </View>
  );
}

/** Outlined gold pill, e.g. "12 €/kg" */
export function GoldPill({ label, large, style }: { label: string; large?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.goldPill, large && { paddingHorizontal: 16, paddingVertical: 6 }, style]}>
      <Text numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: (large ? 18 : 15) - (label.length > 7 ? 2.5 : 0), color: colors.goldBright }}>
        {label}
      </Text>
    </View>
  );
}

export function TrustPill({ score }: { score: number }) {
  const tone = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.danger;
  return (
    <View style={styles.trust}>
      <Ionicons name="shield-checkmark" size={12} color={tone} />
      <T v="caption">{score}</T>
      <T v="caption" color={colors.textMuted}>
        confiance
      </T>
    </View>
  );
}

/* ---------- Layout bits ---------- */

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <T v="title" style={{ fontSize: 25 }}>
        {title}
      </T>
      {action && (
        <Pressable onPress={onAction} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <T v="bodyStrong" color={colors.gold} style={{ fontFamily: fonts.medium }}>
            {action}
          </T>
          <Ionicons name="arrow-forward" size={16} color={colors.gold} />
        </Pressable>
      )}
    </View>
  );
}

export function Chip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: IconName;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      disabled={!onPress}
      style={[styles.chip, active && { borderColor: colors.gold, backgroundColor: colors.goldSoft }]}>
      {icon && <Ionicons name={icon} size={16} color={active ? colors.goldBright : colors.gold} />}
      <T v="small" color={active ? colors.goldBright : colors.text} style={{ fontFamily: fonts.medium }}>
        {label}
      </T>
    </Pressable>
  );
}

/**
 * Route line with a plane that moves along it.
 * `progress` (0–1) places the plane: here it shows how full the traveler's suitcase is,
 * so the plane gets closer to the destination as kilos get booked.
 */
export function FlightProgress({ progress, from, to }: { progress: number; from?: string; to?: string }) {
  const p = Math.min(Math.max(progress, 0.04), 0.96);
  return (
    <View>
      <View style={styles.fpTrack}>
        <View style={styles.fpDash} />
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fpFill, { width: `${p * 100}%` }]} />
        <View style={[styles.fpDot, { left: 0, backgroundColor: colors.gold }]} />
        <View style={[styles.fpDot, { right: 0, borderWidth: 1.5, borderColor: colors.gold, backgroundColor: colors.bg }]} />
        <View style={[styles.fpPlane, { left: `${p * 100}%` }]}>
          <Ionicons name="airplane" size={14} color={colors.onGold} />
        </View>
      </View>
      {(from || to) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <T v="caption" color={colors.textMuted}>
            {from}
          </T>
          <T v="caption" color={colors.textMuted}>
            {to}
          </T>
        </View>
      )}
    </View>
  );
}

export function Divider({ vertical, style }: { vertical?: boolean; style?: StyleProp<ViewStyle> }) {
  return <View style={[vertical ? { width: 1, alignSelf: 'stretch' } : { height: 1 }, { backgroundColor: colors.border }, style]} />;
}

const styles = StyleSheet.create({
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  taglineLine: { width: 28, height: 1, backgroundColor: 'rgba(228,188,131,0.6)' },
  tagline: { fontFamily: fonts.medium, fontSize: 9.5, letterSpacing: 2.6, color: '#D9CBB0', textTransform: 'uppercase' },
  headerArt: { position: 'absolute', right: -40, top: 0, width: 300, height: 320, opacity: 0.95 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  btn: { overflow: 'hidden' },
  btnInner: { paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  iconBtn: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23,38,56,0.85)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.gold },
  verified: { backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  goldPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    borderColor: colors.gold,
    backgroundColor: 'rgba(228,188,131,0.10)',
  },
  trust: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(228,188,131,0.45)',
    backgroundColor: colors.bgRaised,
  },
  fpTrack: { height: 24, justifyContent: 'center', marginHorizontal: 4 },
  fpDash: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(228,188,131,0.45)' },
  fpFill: { position: 'absolute', left: 0, height: 2, borderRadius: 1 },
  fpDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, top: 8 },
  fpPlane: {
    position: 'absolute',
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.gold,
  },
});
