import React, { useEffect, useMemo, useState } from 'react';
import { debugStore, type DebugEntry } from '@/lib/debugStore';
import { getTelegramDebugSnapshot } from '@/lib/telegramWebApp';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebug } from '@/lib/DebugContext';

export const DebugPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const [tick, setTick] = useState(0);
  const { enabled } = useDebug();

  useEffect(() => {
    if (!enabled) return;
    return debugStore.subscribe(setEntries);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !open) return;
    const t = window.setInterval(() => setTick((v) => v + 1), 500);
    return () => window.clearInterval(t);
  }, [enabled, open]);

  const snapshot = useMemo(() => {
    // tick forces refresh while open (initData may appear late)
    void tick;
    return getTelegramDebugSnapshot();
  }, [tick]);

  if (!enabled) return null;

  const apiBase =
    (((import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_API_BASE_URL as string | undefined) ?? '').trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed right-3 top-3 z-[200] rounded-full border px-3 py-2 text-xs font-bold shadow-sm',
          open ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200'
        )}
      >
        DEBUG
      </button>

      {open ? (
        <div className="fixed inset-x-3 top-14 z-[200] max-w-lg mx-auto rounded-3xl border border-gray-200 bg-white/95 backdrop-blur-xl shadow-xl">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-black text-gray-900">Debug</div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => debugStore.clear()}>
                  Clear
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-2xl bg-gray-50 p-2 border border-gray-100">
                <div className="text-gray-500 font-semibold">Telegram</div>
                <div className="text-gray-900 font-bold">
                  obj:{snapshot.hasTelegramObject ? 'yes' : 'no'} webapp:{snapshot.hasWebAppObject ? 'yes' : 'no'}
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 p-2 border border-gray-100">
                <div className="text-gray-500 font-semibold">initData</div>
                <div className="text-gray-900 font-bold">
                  len:{snapshot.initDataLength} src:{snapshot.initDataSource}
                </div>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-gray-400 break-all">
              API: {apiBase || '(empty)'}
            </div>
            <div className="mt-1 text-[10px] text-gray-400 break-all">
              {snapshot.search} {snapshot.hash}
            </div>
          </div>

          <div className="max-h-[50vh] overflow-auto p-3 space-y-2">
            {entries.length === 0 ? (
              <div className="text-xs text-gray-500 p-2">No requests logged yet.</div>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="rounded-2xl border border-gray-100 bg-white p-3">
                  {e.kind === 'log' ? (
                    <>
                      <div className="text-[11px] font-black text-gray-900">LOG</div>
                      <div className="mt-1 text-[10px] text-gray-600 break-all">{e.message}</div>
                      {e.meta ? (
                        <div className="mt-1 text-[10px] text-gray-400 break-all">
                          {Object.entries(e.meta)
                            .map(([k, v]) => `${k}:${String(v)}`)
                            .join(' ')}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-black text-gray-900">
                          {e.method} {e.phase}
                        </div>
                        <div className="text-[11px] font-bold text-gray-600">
                          {e.status !== undefined ? `status:${e.status}` : e.phase === 'error' ? 'error' : ''}
                        </div>
                      </div>
                      <div className="mt-1 text-[10px] text-gray-500 break-all">{e.url}</div>
                      <div className="mt-1 text-[10px] text-gray-400">
                        initDataLen:{e.initDataLength ?? '-'} {e.ok !== undefined ? `ok:${e.ok}` : ''}
                      </div>
                      {e.error ? <div className="mt-1 text-[10px] text-red-600 break-all">{e.error}</div> : null}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};
