export interface TenantConfig {
  id: string;
  marketName: string;
  countryCode: string;
  defaultLanguage: 'en' | 'sw';
  defaultCenter: [number, number];
}

export const TENANTS: Record<string, TenantConfig> = {
  ke: {
    id: 'ke',
    marketName: 'Kenya',
    countryCode: 'KE',
    defaultLanguage: 'en',
    defaultCenter: [36.82598, -1.29901], // Nairobi
  },
  tz: {
    id: 'tz',
    marketName: 'Tanzania',
    countryCode: 'TZ',
    defaultLanguage: 'sw',
    defaultCenter: [39.2622, -6.7924], // Dar es Salaam
  },
  ng: {
    id: 'ng',
    marketName: 'Nigeria',
    countryCode: 'NG',
    defaultLanguage: 'en',
    defaultCenter: [3.3792, 6.5244], // Lagos
  },
};

const DEFAULT_TENANT_ID = 'ke';

export function resolveTenantId(): string {
  // 1. Try to get tenant from URL query param (e.g. ?tenant=ng)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const tenantParam = params.get('tenant');
    if (tenantParam && TENANTS[tenantParam.toLowerCase()]) {
      return tenantParam.toLowerCase();
    }
  }

  // 2. Try to get tenant from environment variable (deployment context)
  const envTenant = import.meta.env.VITE_TENANT_ID;
  if (envTenant && TENANTS[envTenant.toLowerCase()]) {
    return envTenant.toLowerCase();
  }

  // 3. Fallback to default
  return DEFAULT_TENANT_ID;
}

export function getTenantConfig(): TenantConfig {
  const id = resolveTenantId();
  return TENANTS[id];
}
