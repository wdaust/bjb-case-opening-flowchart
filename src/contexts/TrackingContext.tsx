import { createContext, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.tsx';
import { initTrackingDb, insertPageView, insertClicks } from '../utils/tracking.ts';
import type { ClickEventData } from '../utils/tracking.ts';

const TrackingContext = createContext(null);

const SESSION_KEY = 'bjb-session-id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const INTERACTIVE_TAGS = new Set(['A', 'BUTTON', 'INPUT', 'SELECT']);

function isInteractive(el: HTMLElement): boolean {
  if (INTERACTIVE_TAGS.has(el.tagName)) return true;
  if (el.getAttribute('role') === 'button') return true;
  return false;
}

function getInteractiveAncestor(el: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = el;
  while (current) {
    if (isInteractive(current)) return current;
    current = current.parentElement;
  }
  return null;
}

export function TrackingProvider({ children }: { children: ReactNode }) {
  const { userToken } = useAuth();
  const location = useLocation();
  const sessionId = useRef(getSessionId());
  const clickBuffer = useRef<ClickEventData[]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Init tracking tables on mount
  useEffect(() => {
    initTrackingDb();
  }, []);

  // Page views
  useEffect(() => {
    if (!userToken) return;
    insertPageView({
      userToken,
      path: location.pathname,
      referrer: document.referrer,
      sessionId: sessionId.current,
    });
  }, [location.pathname, userToken]);

  // Flush click buffer
  const flush = useCallback(() => {
    if (clickBuffer.current.length === 0) return;
    const batch = clickBuffer.current.splice(0);
    insertClicks(batch);
  }, []);

  // Click listener
  useEffect(() => {
    if (!userToken) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = getInteractiveAncestor(target);
      if (!interactive) return;

      clickBuffer.current.push({
        userToken,
        path: location.pathname,
        targetTag: interactive.tagName.toLowerCase(),
        targetText: (interactive.textContent || '').trim().slice(0, 100),
        targetId: interactive.id || '',
        targetClass: interactive.className?.toString().slice(0, 200) || '',
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
        sessionId: sessionId.current,
      });

      if (clickBuffer.current.length >= 10) flush();
    };

    document.addEventListener('click', handler, { capture: true });
    flushTimer.current = setInterval(flush, 2000);

    return () => {
      document.removeEventListener('click', handler, { capture: true });
      clearInterval(flushTimer.current);
      flush();
    };
  }, [userToken, location.pathname, flush]);

  return (
    <TrackingContext.Provider value={null}>
      {children}
    </TrackingContext.Provider>
  );
}
