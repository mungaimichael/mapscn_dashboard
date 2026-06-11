import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/hooks/useTenant';
import { registerTestDriver } from '@/lib/api';

const COUNTRY_PREFIXES: Record<string, string> = {
  KE: '+254',
  TZ: '+255',
  NG: '+234',
};

export function TestPayloadForm() {
  const { tenant } = useTenant();
  const [name, setName] = useState('');
  const [phoneLine, setPhoneLine] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const prefix = COUNTRY_PREFIXES[tenant.countryCode] || '+000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phoneLine) return;

    setIsSubmitting(true);
    setSuccess(false);

    // Format the payload with the country-specific prefix
    const payload = {
      name,
      phoneNumber: `${prefix}${phoneLine}`,
      market: tenant.marketName,
    };

    // Send the payload through our mock API
    await registerTestDriver(tenant.id, payload);

    setIsSubmitting(false);
    setSuccess(true);
    setName('');
    setPhoneLine('');

    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-xl p-4 w-72 pointer-events-auto transition-all">
      <div className="mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-1">
          Simulate Payload
        </h3>
        <p className="text-[10px] text-foreground/50">
          Check browser console after submitting to see how payload adapt to the {tenant.marketName} context.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[10px] font-medium text-foreground/60 mb-1">Driver Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full text-xs px-3 py-2 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium text-foreground/60 mb-1">Phone Number</label>
          <div className="flex relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground/40 font-mono">
              {prefix}
            </span>
            <input
              type="tel"
              value={phoneLine}
              onChange={(e) => setPhoneLine(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="712345678"
              className="w-full text-xs pl-12 pr-3 py-2 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-semibold transition-all duration-300",
            success
              ? "bg-emerald-500 text-white"
              : "bg-foreground text-background hover:opacity-90 disabled:opacity-50"
          )}
        >
          {success ? (
            <>
              <CheckCircle2 className="size-3.5" /> Sent!
            </>
          ) : isSubmitting ? (
            <span className="animate-pulse">Sending...</span>
          ) : (
            <>
              <Send className="size-3.5" /> Submit Driver
            </>
          )}
        </button>
      </form>
    </div>
  );
}
