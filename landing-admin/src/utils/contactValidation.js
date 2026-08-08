/**
 * Re-export shared contact validation.
 * Keep behavior in sync with @raulizqli/landing-core/contactValidation.
 */
export {
  isValidEmail,
  normalizeEmail,
  digitsOnly,
  normalizeMxUsPhone,
  isValidMxUsPhone,
  APPROVAL_STATUSES,
  normalizeApprovalStatus,
} from '@raulizqli/landing-core/contactValidation';
