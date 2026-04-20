import { getApiBaseUrl } from '@/config';
import { debugStore, makeId } from '@/lib/debugStore';

interface ApiEnvelope<T> {
  status: string;
  data: T;
  message?: string;
}

interface SubsidyPayload {
  panel_type: string;
  inverter_type: string;
  requested_power_kw: number;
  audit_power_kw: number;
}

const API_BASE_URL = getApiBaseUrl();

const unwrapData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers ?? {});
  if (init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${path}`;
  debugStore.push({
    id: makeId(),
    ts: Date.now(),
    kind: 'http',
    phase: 'start',
    method: init?.method ?? 'GET',
    url,
    initDataLength: 0,
  });

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      method: init?.method ?? 'GET',
      headers,
      credentials: 'include',
    });
  } catch (err) {
    debugStore.push({
      id: makeId(),
      ts: Date.now(),
      kind: 'http',
      phase: 'error',
      method: init?.method ?? 'GET',
      url,
      error: err instanceof Error ? err.message : String(err),
      initDataLength: 0,
    });
    throw err;
  }

  let payload: unknown = null;
  let rawText = '';
  try {
    rawText = await response.text();
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const snippet = rawText ? rawText.slice(0, 220).replace(/\s+/g, ' ').trim() : '';
    debugStore.push({
      id: makeId(),
      ts: Date.now(),
      kind: 'http',
      phase: 'end',
      method: init?.method ?? 'GET',
      url,
      status: response.status,
      ok: false,
      initDataLength: 0,
      error: snippet ? `HTTP ${response.status}: ${snippet}` : `HTTP ${response.status}`,
    });

    const message =
      (payload &&
        typeof payload === 'object' &&
        'detail' in payload &&
        typeof (payload as { detail?: unknown }).detail === 'string' &&
        (payload as { detail: string }).detail) ||
      (payload &&
        typeof payload === 'object' &&
        'message' in payload &&
        typeof (payload as { message?: unknown }).message === 'string' &&
        (payload as { message: string }).message) ||
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  debugStore.push({
    id: makeId(),
    ts: Date.now(),
    kind: 'http',
    phase: 'end',
    method: init?.method ?? 'GET',
    url,
    status: response.status,
    ok: true,
    initDataLength: 0,
  });

  return unwrapData<T>(payload);
};

export const common = {
  calculateSubsidy: async (payload: SubsidyPayload): Promise<unknown> =>
    request<unknown>('/api/common/public/subsidy-calculator/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
