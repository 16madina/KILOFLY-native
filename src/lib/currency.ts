// Shows prices in the viewer's own currency (approximate), next to the listing's real currency.
// Rates come from public.exchange_rates (EUR based); the CFA franc is pegged to the euro.
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { money } from '@/lib/listings';
import { supabase } from '@/lib/supabase';

// Units of each currency for 1 EUR. Fallback if the table is empty or a currency is missing.
const FALLBACK: Record<string, number> = { EUR: 1, XOF: 655.957, XAF: 655.957, USD: 1.08, CAD: 1.5, GBP: 0.85, MAD: 10.8, GNF: 9300 };
let cache: Record<string, number> | null = null;
let loading: Promise<Record<string, number>> | null = null;

async function loadRates(): Promise<Record<string, number>> {
  if (cache) return cache;
  if (!loading) {
    loading = (async () => {
      const rates = { ...FALLBACK };
      const { data } = await supabase.from('exchange_rates').select('target_currency, rate').eq('base_currency', 'EUR');
      for (const r of (data ?? []) as { target_currency: string; rate: number }[]) {
        if (r.target_currency !== 'XOF' && Number(r.rate) > 0) rates[r.target_currency] = Number(r.rate);
      }
      cache = rates;
      return rates;
    })();
  }
  return loading;
}

// Country (code or French name) -> currency.
const CFA = ['SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GW'];
const CFA_NAMES = ['senegal', 'cote d ivoire', 'mali', 'burkina faso', 'niger', 'togo', 'benin', 'guinee-bissau'];
const XAF = ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ'];
const strip = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, ' ').trim();

export function currencyForCountry(country?: string | null): string | null {
  if (!country) return null;
  const c = country.trim();
  const up = c.toUpperCase();
  const n = strip(c);
  if (CFA.includes(up) || CFA_NAMES.includes(n)) return 'XOF';
  if (XAF.includes(up) || ['cameroun', 'gabon', 'congo', 'tchad'].includes(n)) return 'XAF';
  if (up === 'CA' || n === 'canada') return 'CAD';
  if (up === 'US' || n === 'etats-unis' || n === 'usa') return 'USD';
  if (up === 'GB' || n === 'royaume-uni') return 'GBP';
  if (up === 'MA' || n === 'maroc') return 'MAD';
  if (up === 'GN' || n === 'guinee') return 'GNF';
  return 'EUR';
}

function deviceCurrency(): string {
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale || '';
    const region = loc.split('-')[1];
    return currencyForCountry(region) ?? 'EUR';
  } catch {
    return 'EUR';
  }
}

/** The viewer's currency: their saved preference, else their country, else the phone's region. */
export function useMyCurrency(): string {
  const { profile } = useAuth();
  return profile?.preferred_currency || currencyForCountry(profile?.country) || deviceCurrency();
}

export function useRates() {
  const [rates, setRates] = useState<Record<string, number>>(cache ?? FALLBACK);
  useEffect(() => {
    loadRates().then(setRates);
  }, []);
  return rates;
}

export function convert(amount: number, from: string, to: string, rates: Record<string, number>): number | null {
  if (from === to) return amount;
  const a = rates[from];
  const b = rates[to];
  if (!a || !b) return null;
  return (amount / a) * b;
}

/** "≈ 6 560 FCFA" in the viewer's currency, or null when it's the same currency. */
export function useApprox() {
  const mine = useMyCurrency();
  const rates = useRates();
  return (amount: number, currency: string): string | null => {
    if (!currency || currency === mine) return null;
    const v = convert(amount, currency, mine, rates);
    if (v == null) return null;
    const rounded = mine === 'XOF' || mine === 'XAF' || mine === 'GNF' ? Math.round(v / 5) * 5 : Math.round(v * 100) / 100;
    return `≈ ${money(rounded, mine)}`;
  };
}
