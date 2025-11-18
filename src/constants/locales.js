// Supported countries for campaign targeting
export const SUPPORTED_COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'IL', label: 'Israel' },
  { code: 'IT', label: 'Italy' },
  { code: 'ES', label: 'Spain' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'MX', label: 'Mexico' },
];

// Default country
export const DEFAULT_COUNTRY = 'US';

// Get country display name by code
export const getCountryDisplayName = (countryCode) => {
  const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
  return country ? country.label : countryCode;
};