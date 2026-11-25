# Reprise des fonctionnalités de l'ancien KiloFly

Source : https://github.com/16madina/KILOFLY (copie locale de référence : `Documents/KILOFLY`, lecture seule).
Cible : ce projet Expo + **nouvelle** base Supabase (choix fait au départ : on ne réutilise pas la base Lovable).

## Ce que contient l'ancienne app

**Base de données (61 migrations)**
- Comptes : `profiles`, `user_roles` (admin/user), `privacy_settings`, `notification_preferences`, `push_tokens`, `legal_signatures`
- Annonces : `listings` (trajets avec kilos), `transport_requests` (demandes d'envoi), `transport_offers` (offres des voyageurs sur une demande), `favorites`, `route_alerts`
- Réservations : `reservations`, `reservation_messages`, `tracking_events`
- Messagerie : `conversations`, `messages`
- Argent : `transactions`, `wallets`, `wallet_transactions`, `exchange_rates`
- Confiance : `reviews`, `reports`, `blocked_users`, `banned_users`, `ai_verification_feedback`, `admin_actions`
- Stockage : buckets `avatars` (public) et `id-documents` (privé)
- ~25 fonctions/triggers SQL : création auto du profil et du portefeuille, kilos disponibles, crédit du portefeuille vendeur à la livraison, notifications (nouvelle réservation, message, offre, alerte de route), archivage des annonces expirées…

**Fonctions serveur (26)**
- Paiement carte : Stripe (`create-payment-intent`, `capture-payment`, `process-stripe-payment`, `create-checkout-session`…)
- Mobile money : CinetPay (`cinetpay-payment`, webhooks, `cinetpay-payout`) + Wave manuel
- Portefeuille : `request-withdrawal`, `mark-transaction-paid`, `cancel-reservation`
- Notifications : push Firebase (`send-push-notification`, `notify-new-listing`, `notify-new-transport-request`), emails Resend, SMS Twilio
- Vérification d'identité par IA (`verify-id-document`, passe par la passerelle IA de Lovable → à remplacer par l'API Claude)
- Divers : taux de change, archivage des annonces expirées, emails admin

**Clés/secrets nécessaires** (à saisir par toi dans Supabase, jamais dans le code) : Stripe, CinetPay, Resend, Twilio, Firebase.

## Plan par étapes

1. **Base & connexion** — créer le projet Supabase, rejouer le schéma (tables, règles de sécurité, triggers, buckets), brancher l'inscription/connexion et le profil dans l'app.
2. **Annonces & recherche** — publier un trajet / une demande, accueil et recherche sur les vraies données, détail du voyage, favoris, alertes de route.
3. **Réservations & paiement** — réserver des kilos, offres sur les demandes, paiement Stripe (carte) puis CinetPay/Wave, frais KiloFly.
4. **Messagerie & suivi** — discussions en temps réel, négociation/offre acceptée, étapes de suivi, code de remise, avis.
5. **Portefeuille & confiance** — solde, crédit à la livraison, retraits, vérification d'identité (IA), téléphone, score de confiance, signalements/blocage.
6. **Notifications** — push (Expo + Firebase), emails, SMS.
7. **Administration** — reste sur le web dans un premier temps (vérifications, retraits, signalements, utilisateurs).
