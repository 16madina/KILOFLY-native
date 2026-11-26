// Package tracking + proof of delivery. Every write goes through checked server functions
// (see migration 20261126120000_tracking_delivery).
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type TrackingStep = 'picked_up' | 'in_transit' | 'arrived' | 'delivered';

export const TRAVELER_STEPS: { key: TrackingStep; label: string; action: string; icon: string }[] = [
  { key: 'picked_up', label: 'Colis remis au voyageur', action: "J'ai récupéré le colis", icon: 'cube' },
  { key: 'in_transit', label: 'En route', action: 'Je suis en route', icon: 'airplane' },
  { key: 'arrived', label: 'Arrivé à destination', action: 'Je suis arrivé', icon: 'location' },
  { key: 'delivered', label: 'Livré', action: 'Livrer le colis', icon: 'checkmark-done' },
];

export type TrackingEvent = {
  id: string;
  status: string;
  description: string | null;
  location_name: string | null;
  is_automatic: boolean;
  photo_path: string | null;
  recipient_name: string | null;
  has_signature: boolean;
  created_at: string;
};

const LABELS: Record<string, string> = {
  pending: 'Demande envoyée',
  approved: 'Acceptée par le voyageur',
  in_progress: 'Paiement sécurisé',
  payment_received: 'Paiement sécurisé',
  picked_up: 'Colis remis au voyageur',
  in_transit: 'En route',
  arrived: 'Arrivé à destination',
  delivered: 'Livré',
  rejected: 'Refusée',
  cancelled: 'Annulée',
};
export const eventLabel = (s: string) => LABELS[s] ?? s;

const rank = (s: string) => TRAVELER_STEPS.findIndex((x) => x.key === s) + 1;

/** Highest step the traveler has reached (0 = none yet). */
export function reachedStep(events: TrackingEvent[]): number {
  return events.filter((e) => !e.is_automatic).reduce((m, e) => Math.max(m, rank(e.status)), 0);
}

/** One line per status (the server also logs automatic events; keep the richest one). */
export function timeline(events: TrackingEvent[]): TrackingEvent[] {
  const byStatus = new Map<string, TrackingEvent>();
  for (const e of events) {
    const prev = byStatus.get(e.status);
    if (!prev || (prev.is_automatic && !e.is_automatic)) byStatus.set(e.status, e);
  }
  return [...byStatus.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function useTracking(reservationId?: string) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!reservationId) return;
    const { data } = await supabase.rpc('get_tracking', { p_reservation_id: reservationId });
    setEvents((data ?? []) as TrackingEvent[]);
    setLoading(false);
  }, [reservationId]);

  useEffect(() => {
    reload();
    if (!reservationId) return;
    // Live updates when the other party moves the parcel forward.
    const ch = supabase
      .channel(`tracking-${reservationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tracking_events', filter: `reservation_id=eq.${reservationId}` }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [reservationId, reload]);

  return { events, loading, reload };
}

export async function getDeliveryCode(reservationId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_delivery_code', { p_reservation_id: reservationId });
  if (error) return null;
  return (data as string | null) ?? null;
}

export async function photoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('delivery-proofs').createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function signatureSvg(eventId: string): Promise<string | null> {
  const { data } = await supabase.rpc('get_delivery_signature', { p_event_id: eventId });
  return (data as string | null) ?? null;
}

/** Opens the camera (or the library as fallback) and returns a local image. */
export async function takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  const res = perm.granted
    ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0];
}

async function uploadPhoto(reservationId: string, asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const ext = (asset.mimeType?.split('/')[1] || asset.uri.split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const path = `${reservationId}/proof-${Date.now()}.${ext}`;
  const body = await (await fetch(asset.uri)).arrayBuffer();
  const { error } = await supabase.storage
    .from('delivery-proofs')
    .upload(path, body, { contentType: asset.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}` });
  if (error) throw new Error("La photo n'a pas pu être envoyée : " + error.message);
  return path;
}

const ERRORS: [string, string][] = [
  ['wrong delivery code', 'Code de livraison incorrect. Demandez au destinataire le code reçu par l’expéditeur.'],
  ['too many attempts', 'Trop de codes incorrects. Contactez le support KiloFly.'],
  ['sender has not opened', 'L’expéditeur n’a pas encore ouvert son code de livraison. Demandez-lui d’ouvrir la réservation dans l’app.'],
  ['signature required', 'La signature du destinataire est obligatoire.'],
  ['recipient name required', 'Indiquez le nom de la personne qui reçoit le colis.'],
  ['step already done', 'Cette étape est déjà enregistrée.'],
  ['reservation not in progress', 'Le suivi démarre une fois la réservation payée.'],
];

export async function advanceTracking(input: {
  reservationId: string;
  step: TrackingStep;
  note?: string;
  location?: string;
  photo?: ImagePicker.ImagePickerAsset | null;
  recipientName?: string;
  signatureSvg?: string;
  code?: string;
}): Promise<{ error?: string }> {
  try {
    const photoPath = input.photo ? await uploadPhoto(input.reservationId, input.photo) : null;
    const { error } = await supabase.rpc('advance_tracking', {
      p_reservation_id: input.reservationId,
      p_step: input.step,
      p_note: input.note || null,
      p_location: input.location || null,
      p_photo_path: photoPath,
      p_recipient_name: input.recipientName || null,
      p_signature_svg: input.signatureSvg || null,
      p_code: input.code || null,
    });
    if (error) {
      const hit = ERRORS.find(([k]) => error.message.includes(k));
      return { error: hit ? hit[1] : error.message };
    }
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}
