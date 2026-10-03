import { useEffect, useState } from 'react';
import { Network, type ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export async function isOnline(): Promise<boolean> {
  try {
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
}

type Listener = (online: boolean) => void;
const listeners = new Set<Listener>();
let nativeHandlerAttached = false;
let cachedOnline: boolean | null = null;

function notify(online: boolean) {
  cachedOnline = online;
  for (const l of listeners) l(online);
}

async function attachNativeHandler() {
  if (nativeHandlerAttached) return;
  nativeHandlerAttached = true;
  try {
    await Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      notify(status.connected);
    });
    const s = await Network.getStatus();
    cachedOnline = s.connected;
  } catch {
    // fall back to window events
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => notify(true));
    window.addEventListener('offline', () => notify(false));
    if (cachedOnline === null) {
      cachedOnline = navigator.onLine;
    }
  }
}

export function subscribeOnline(cb: Listener): () => void {
  void attachNativeHandler();
  listeners.add(cb);
  if (cachedOnline !== null) {
    cb(cachedOnline);
  } else {
    void isOnline().then((online) => {
      cachedOnline = online;
      cb(online);
    });
  }
  return () => {
    listeners.delete(cb);
  };
}

export function useOnlineStatus(): boolean {
  const initial = cachedOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [online, setOnline] = useState<boolean>(initial);
  useEffect(() => subscribeOnline(setOnline), []);
  return online;
}

export function getPlatform(): 'web' | 'ios' | 'android' {
  return Capacitor.getPlatform() as 'web' | 'ios' | 'android';
}
