import {
  SHARED_PERSONA_SCHEMA_VERSION,
  SharedPersonaSnapshot,
  StoredSharedPersona,
} from '../types/sharedPersona';

const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;

const errorMessageFromResponse = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = await response.json();
    return typeof body?.error === 'string' ? body.error : fallback;
  } catch {
    return fallback;
  }
};

export const currentShareId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const id = new URLSearchParams(window.location.search).get('p');
  return id && SHARE_ID_PATTERN.test(id) ? id : null;
};

export const sharedPersonaUrl = (id: string): string => {
  if (!SHARE_ID_PATTERN.test(id)) throw new Error('Share link is invalid.');
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set('p', id);
  return url.toString();
};

export const replaceCurrentUrlWithShare = (id: string): string => {
  const url = sharedPersonaUrl(id);
  window.history.replaceState({ sharedPersonaId: id }, '', url);
  return url;
};

export const removeShareFromCurrentUrl = (): void => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('p')) return;
  url.searchParams.delete('p');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

export const createSharedPersona = async (snapshot: SharedPersonaSnapshot): Promise<string> => {
  if (snapshot.schemaVersion !== SHARED_PERSONA_SCHEMA_VERSION) {
    throw new Error('Unsupported share snapshot version.');
  }
  const response = await fetch('/api/persona-share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  });
  if (!response.ok) {
    throw new Error(await errorMessageFromResponse(response, 'Could not create a share link.'));
  }
  const body = await response.json();
  if (!body?.id || !SHARE_ID_PATTERN.test(body.id)) {
    throw new Error('The share service returned an invalid link.');
  }
  return body.id;
};

export const loadSharedPersona = async (id: string): Promise<StoredSharedPersona> => {
  if (!SHARE_ID_PATTERN.test(id)) throw new Error('Share link is invalid.');
  const response = await fetch(`/api/persona-share?id=${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(await errorMessageFromResponse(response, 'Could not load this shared persona.'));
  }
  const stored = await response.json() as StoredSharedPersona;
  if (
    stored?.id !== id ||
    stored?.snapshot?.schemaVersion !== SHARED_PERSONA_SCHEMA_VERSION ||
    !stored?.snapshot?.persona?.character?.name
  ) {
    throw new Error('The shared persona record is invalid.');
  }
  return stored;
};

export const copyTextToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Copying the link was not supported by this browser.');
};
