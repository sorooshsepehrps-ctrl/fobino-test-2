const TRANSACTION_DOMAINS = Object.freeze([
  'wallet',
  'subscription',
  'deal',
  'shipping',
  'inspection',
  'marketing',
  'dropshipping',
  'withdrawal',
  'system',
  'post',
  'exchange',
  'invitation',
]);

const TRANSACTION_FLOWS = Object.freeze([
  'deposit_init',
  'deposit_verify',
  'deposit_fail',
  'withdraw_request',
  'withdraw_complete',
  'withdraw_reject',
  'wallet_payment',
  'block',
  'release',
  'refund',
  'fee',
  'commission',
  'incoming_pending',
  'incoming_released',
  'info',
]);

const TRANSACTION_DIRECTIONS = Object.freeze([
  'in',
  'out',
  'hold',
  'release',
  'info',
]);

const TRANSACTION_IMPACTS = Object.freeze([
  'available_increase',
  'available_decrease',
  'blocked_increase',
  'blocked_decrease',
  'available_to_blocked',
  'blocked_to_available',
  'blocked_to_external',
  'no_balance_change',
]);

const SETTLEMENT_STATUSES = Object.freeze([
  'none',
  'pending',
  'blocked_for_future_release',
  'blocked_for_possible_refund',
  'released_to_beneficiary',
  'released_to_wallet',
  'refunded',
  'failed',
  'cancelled',
  'completed',
  'rejected',
]);

const COUNTERPARTY_ROLES = Object.freeze([
  'buyer',
  'seller',
  'marketer',
  'provider',
  'platform',
  'gateway',
  'system',
  'admin',
  'none',
]);

const REFERENCE_TYPES = Object.freeze([
  'deal',
  'subscription',
  'invitation',
  'withdrawal',
  'deposit',
  'gateway',
  'post',
  'trade_contract',
  'inspection',
  'shipping',
  'dropshipping_rfp',
  'wallet',
  'system',
]);

const LEGACY_TYPES = Object.freeze([
  'deposit',
  'withdrawal',
  'payment',
  'refund',
  'commission',
  'escrow_deposit',
  'escrow_release',
  'subscription',
  'invitation',
  'transfer',
  'currency_exchange',
  'post_enhancement',
  'commission_deposit',
  'commission_received',
  'commission_refund',
  'platform_fee',
]);

module.exports = {
  TRANSACTION_DOMAINS,
  TRANSACTION_FLOWS,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_IMPACTS,
  SETTLEMENT_STATUSES,
  COUNTERPARTY_ROLES,
  REFERENCE_TYPES,
  LEGACY_TYPES,
};