// Supported countries for campaign targeting
export const SUPPORTED_COUNTRIES = [
  { code: 'AU', label: 'Australia' },
  { code: 'AT', label: 'Austria' },
  { code: 'BE', label: 'Belgium' },
  { code: 'CA', label: 'Canada' },
  { code: 'CZ', label: 'Czechia' },
  { code: 'DK', label: 'Denmark' },
  { code: 'FI', label: 'Finland' },
  { code: 'FR', label: 'France' },
  { code: 'DE', label: 'Germany' },
  { code: 'GR', label: 'Greece' },
  { code: 'HU', label: 'Hungary' },
  { code: 'IE', label: 'Ireland' },
  { code: 'IL', label: 'Israel' },
  { code: 'IT', label: 'Italy' },
  { code: 'MX', label: 'Mexico' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'NO', label: 'Norway' },
  { code: 'PL', label: 'Poland' },
  { code: 'PT', label: 'Portugal' },
  { code: 'RO', label: 'Romania' },
  { code: 'RU', label: 'Russia' },
  { code: 'ES', label: 'Spain' },
  { code: 'SE', label: 'Sweden' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'US', label: 'United States' },
];

// Default country
export const DEFAULT_COUNTRY = 'US';

// Get country display name by code
export const getCountryDisplayName = (countryCode) => {
  const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
  return country ? country.label : countryCode;
};

// Convert an ISO-3166-1 alpha-2 code (e.g. "IT") to its flag emoji ("🇮🇹").
// Returns a globe for unknown / non-country codes like "GLOBAL".
export const countryCodeToFlagEmoji = (code) => {
  if (typeof code !== 'string' || code.length !== 2) return '🌐';
  const OFFSET = 127397;
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '🌐';
  return String.fromCodePoint(
    upper.charCodeAt(0) + OFFSET,
    upper.charCodeAt(1) + OFFSET,
  );
};