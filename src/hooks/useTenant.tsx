import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TenantConfig } from '@/config/tenantConfig';
import { getTenantConfig } from '@/config/tenantConfig';

interface TenantContextType {
  tenant: TenantConfig;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  // We resolve the tenant config once when the provider mounts
  const [tenant, setTenant] = useState<TenantConfig>(getTenantConfig());

  // If using URL params to switch, we might want to listen to changes 
  // or just rely on full page reloads. In a real app, tenant doesn't change mid-session.
  useEffect(() => {
    setTenant(getTenantConfig());
  }, []);

  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
