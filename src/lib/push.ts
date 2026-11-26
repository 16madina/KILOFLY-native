// Push notifications (Expo). Registers this phone for the signed-in user and opens the right
// screen when a notification is tapped. Sending happens on the server (see the
// 20261126110000_push_notifications migration): every row added to `notifications` is pushed.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Asks permission (once) and returns this device's Expo push token, or null. */
export async function getPushToken(): Promise<string | null> {
  if (!isNative || !Device.isDevice) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'KiloFly',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#E4BC83',
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  const id = projectId();
  if (!id) {
    console.warn('push: no EAS projectId in app config');
    return null;
  }
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId: id });
  return data;
}

let lastToken: string | null = null;

/** Saves the token for the signed-in user (server moves it off any previous account). */
export async function registerPush(): Promise<void> {
  try {
    const token = await getPushToken();
    if (!token) return;
    lastToken = token;
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
    if (error) console.warn('push: register failed', error.message);
  } catch (e) {
    console.warn('push: register failed', e);
  }
}

/** Call before signing out so the phone stops receiving this account's notifications. */
export async function unregisterPush(): Promise<void> {
  if (!lastToken) return;
  try {
    await supabase.rpc('unregister_push_token', { p_token: lastToken });
  } catch {
    // ignore
  }
}

type PushData = { reservation_id?: string; conversation_id?: string; transport_request_id?: string; listing_id?: string };

function openFromData(data: PushData | undefined) {
  if (!data) return;
  if (data.reservation_id) router.push({ pathname: '/reservation/[id]', params: { id: data.reservation_id } });
  else if (data.conversation_id) router.push({ pathname: '/conversation/[id]', params: { id: data.conversation_id } });
  else if (data.transport_request_id) router.push({ pathname: '/request/[id]', params: { id: data.transport_request_id } });
  else if (data.listing_id) router.push({ pathname: '/listing/[id]', params: { id: data.listing_id } });
  else router.push('/(tabs)/tracking');
}

/** Registers when signed in, and opens the matching screen when a notification is tapped. */
export function usePushNotifications(userId: string | undefined) {
  const handledLaunch = useRef(false);

  useEffect(() => {
    if (!isNative || !userId) return;
    registerPush();
  }, [userId]);

  useEffect(() => {
    if (!isNative) return;
    // App opened by tapping a notification while it was closed.
    if (!handledLaunch.current) {
      handledLaunch.current = true;
      const last = Notifications.getLastNotificationResponse();
      if (last) setTimeout(() => openFromData(last.notification.request.content.data as PushData), 300);
    }
    const sub = Notifications.addNotificationResponseReceivedListener((r) =>
      openFromData(r.notification.request.content.data as PushData),
    );
    return () => sub.remove();
  }, []);
}
