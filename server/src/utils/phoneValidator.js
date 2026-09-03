/**
 * Indian Mobile Phone & Masking Utilities
 * Compliant with Department of Telecommunications (DoT) standard 10-digit mobile numbering scheme.
 * Indian mobile numbers must start with 6, 7, 8, or 9 and have 10 digits.
 */

/**
 * Validates if the given string is a valid Indian mobile number.
 * Accepts optional +91, 91, or 0 prefixes, with spaces or hyphens.
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidIndianMobile = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Clean non-digits except leading +
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  // Matches:
  // - 10 digits starting with 6-9
  // - +91 followed by 10 digits starting with 6-9
  // - 91 followed by 10 digits starting with 6-9
  // - 0 followed by 10 digits starting with 6-9
  const indianMobileRegex = /^(?:(?:\+91|91|0))?([6-9]\d{9})$/;
  return indianMobileRegex.test(cleaned);
};

/**
 * Normalizes an Indian mobile number to a clean 10-digit string (e.g. "9876543210").
 * @param {string} phone
 * @returns {string|null}
 */
export const normalizeIndianMobile = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  const match = cleaned.match(/^(?:(?:\+91|91|0))?([6-9]\d{9})$/);
  return match ? match[1] : null;
};

/**
 * Formats an Indian mobile number to E.164 international standard ("+919876543210").
 * @param {string} phone
 * @returns {string|null}
 */
export const formatE164IndianMobile = (phone) => {
  const normalized = normalizeIndianMobile(phone);
  return normalized ? `+91${normalized}` : null;
};

/**
 * Formats an Indian mobile number for the MSG91 SMS API gateway ("919876543210").
 * @param {string} phone
 * @returns {string|null}
 */
export const formatMSG91Mobile = (phone) => {
  const normalized = normalizeIndianMobile(phone);
  return normalized ? `91${normalized}` : null;
};

/**
 * Safely masks a phone number for user display (e.g. "+91 ******3210").
 * @param {string} phone
 * @returns {string}
 */
export const maskPhone = (phone) => {
  const normalized = normalizeIndianMobile(phone);
  if (!normalized) return '******0000';
  const lastFour = normalized.slice(-4);
  return `+91 ******${lastFour}`;
};

/**
 * Safely masks an email address for user display (e.g. "r***h@example.com").
 * @param {string} email
 * @returns {string}
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '******';
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}${'*'.repeat(Math.max(3, local.length - 2))}${last}@${domain}`;
};
