// Liability contract signed before accepting (traveler) or paying (sender). Enforced by the server.
import { supabase } from '@/lib/supabase';

export type ContractType = 'sender' | 'transporter';
export type Terms = { version: string; title: string; clauses: string[] };
export type SignedContract = { signature_type: ContractType; signer_name: string | null; signed_at: string; terms: Terms & { sha256?: string }; signature_svg: string };

export async function getTerms(type: ContractType): Promise<Terms | null> {
  const { data } = await supabase.rpc('contract_terms', { p_type: type });
  return (data as Terms | null) ?? null;
}

export async function getContracts(reservationId: string): Promise<SignedContract[]> {
  const { data } = await supabase.rpc('get_contracts', { p_reservation_id: reservationId });
  return (data ?? []) as SignedContract[];
}

export async function signContract(reservationId: string, type: ContractType, svg: string) {
  const { error } = await supabase.rpc('sign_contract', { p_reservation_id: reservationId, p_type: type, p_signature_svg: svg });
  return error ? { error: error.message.includes('signature required') ? 'Signez dans le cadre avec votre doigt.' : error.message } : {};
}
