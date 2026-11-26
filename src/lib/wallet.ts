// Wallet: balance, history and withdrawals (all checked on the server).
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type Wallet = { balance: number; currency: string; pending: number; withdrawing: number; total_earned: number; min_withdrawal: number };
export type WalletTx = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string | null;
  payout_method: string | null;
  reservation_id: string | null;
  route: string | null;
  created_at: string;
  note: string | null;
};

export const PAYOUT_METHODS: { key: string; label: string; kind: 'phone' | 'iban' | 'email'; tint: string; hint: string }[] = [
  { key: 'wave', label: 'Wave', kind: 'phone', tint: '#1DC8FF', hint: 'Sénégal, Côte d’Ivoire, Mali, Burkina' },
  { key: 'orange_money', label: 'Orange Money', kind: 'phone', tint: '#FF7900', hint: 'Afrique de l’Ouest' },
  { key: 'mtn_momo', label: 'MTN MoMo', kind: 'phone', tint: '#FFCB05', hint: 'Côte d’Ivoire, Bénin, Cameroun…' },
  { key: 'moov_money', label: 'Moov Money', kind: 'phone', tint: '#0066B3', hint: 'Côte d’Ivoire, Bénin, Togo…' },
  { key: 'bank_transfer', label: 'Virement bancaire', kind: 'iban', tint: '#E4BC83', hint: 'IBAN (Europe) ou RIB' },
  { key: 'interac', label: 'Interac', kind: 'email', tint: '#FDB913', hint: 'Canada — virement par courriel' },
];
export const methodLabel = (k?: string | null) => PAYOUT_METHODS.find((m) => m.key === k)?.label ?? k ?? '';

const ERR: [string, string][] = [
  ['insufficient balance', 'Solde insuffisant.'],
  ['below minimum', 'Montant inférieur au minimum de retrait.'],
  ['invalid phone', 'Numéro de téléphone invalide (avec l’indicatif, ex. +221 77 123 45 67).'],
  ['iban required', 'Indiquez votre IBAN ou RIB.'],
  ['email required', 'Indiquez une adresse courriel valide.'],
  ['withdrawal already pending', 'Vous avez déjà un retrait en cours de traitement.'],
];
export const walletError = (m: string) => ERR.find(([k]) => m.includes(k))?.[1] ?? m;

export function useWallet() {
  const { session } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<WalletTx[] | null>(null);

  const reload = useCallback(async () => {
    if (!session) return;
    const [w, h] = await Promise.all([supabase.rpc('get_my_wallet'), supabase.rpc('get_my_wallet_history')]);
    const row = ((w.data ?? []) as Wallet[])[0];
    setWallet(
      row
        ? { ...row, balance: Number(row.balance), pending: Number(row.pending), withdrawing: Number(row.withdrawing), total_earned: Number(row.total_earned), min_withdrawal: Number(row.min_withdrawal) }
        : null,
    );
    setHistory(((h.data ?? []) as WalletTx[]).map((t) => ({ ...t, amount: Number(t.amount) })));
  }, [session]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { wallet, history, reload };
}

export async function requestWithdrawal(input: { amount: number; method: string; phone?: string; iban?: string; email?: string; accountName?: string }) {
  const { error } = await supabase.rpc('request_withdrawal', {
    p_amount: input.amount,
    p_method: input.method,
    p_phone: input.phone || null,
    p_details: { iban: input.iban || null, email: input.email || null, account_name: input.accountName || null },
  });
  return error ? { error: walletError(error.message) } : {};
}

export async function cancelWithdrawal(id: string) {
  const { error } = await supabase.rpc('cancel_my_withdrawal', { p_id: id });
  return error ? { error: error.message } : {};
}
