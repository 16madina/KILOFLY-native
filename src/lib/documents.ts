// PDF documents (signed engagement, payment receipt) built by the "documents" server function.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type DocKind = 'contract' | 'invoice';

type Result = { pdf?: string; filename?: string; emailed?: boolean; email?: string; error?: string };

async function call(kind: DocKind, reservationId: string, opts: { type?: 'sender' | 'transporter'; email?: boolean }): Promise<Result> {
  const { data, error } = await supabase.functions.invoke('documents', {
    body: { kind, reservation_id: reservationId, type: opts.type, email: !!opts.email },
  });
  if (error) {
    let msg = error.message;
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) msg = body.error;
    } catch {
      // keep generic message
    }
    return { error: msg === 'not paid' ? 'Le reçu sera disponible après le paiement.' : msg === 'not signed' ? 'Ce document n’a pas encore été signé.' : 'Document indisponible pour le moment.' };
  }
  return data as Result;
}

/** Sends the PDF to the user's own e-mail address. */
export async function emailDocument(kind: DocKind, reservationId: string, type?: 'sender' | 'transporter') {
  const r = await call(kind, reservationId, { type, email: true });
  if (r.error) return { error: r.error };
  if (!r.emailed) return { error: 'L’envoi par courriel n’est pas encore activé. Vous pouvez télécharger le PDF.' };
  return { email: r.email };
}

/** Downloads the PDF and opens the share sheet (save to Files, WhatsApp, mail…). */
export async function shareDocument(kind: DocKind, reservationId: string, type?: 'sender' | 'transporter') {
  const r = await call(kind, reservationId, { type });
  if (r.error || !r.pdf) return { error: r.error ?? 'Document indisponible.' };
  const name = r.filename ?? 'KiloFly.pdf';
  if (Platform.OS === 'web') {
    const a = document.createElement('a');
    a.href = `data:application/pdf;base64,${r.pdf}`;
    a.download = name;
    a.click();
    return {};
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(r.pdf, { encoding: 'base64' });
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: name, UTI: 'com.adobe.pdf' });
  return {};
}
