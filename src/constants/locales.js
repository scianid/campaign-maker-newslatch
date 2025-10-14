// Supported countries for campaign targeting
export const SUPPORTED_COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'ES', label: 'Spain' },
  { code: 'IT', label: 'Italy' },
  { code: 'CA', label: 'Switzerland' },
];

// Default country
export const DEFAULT_COUNTRY = 'CA';

// Get country display name by code
export const getCountryDisplayName = (countryCode) => {
  const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
  return country ? country.label : countryCode;
};