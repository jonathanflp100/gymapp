/**
 * Notificações no celular. Modo completo: inscrição no servidor da academia (web push).
 * Demo: mostra uma notificação local de exemplo.
 * No iPhone, só funciona com o app instalado na tela inicial (iOS 16.4+).
 */
import { hub } from './hub';
import { REAL_BACKEND } from './openGymBackend';

export type PushState = 'unsupported' | 'denied' | 'off' | 'on';

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const keyBytes = (b64: string) => {
  const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (!REAL_BACKEND) return Notification.permission === 'granted' && localStorage.getItem('gymapp.demoPush') === '1' ? 'on' : 'off';
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? 'on' : 'off';
}

export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off';
  if (!REAL_BACKEND) {
    localStorage.setItem('gymapp.demoPush', '1');
    return 'on';
  }
  const reg = await registration();
  if (!reg) return 'unsupported';
  await navigator.serviceWorker.ready;
  const { publicKey } = await hub.pushKey();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
  await hub.pushSubscribe(sub.toJSON());
  return 'on';
}

export async function disablePush(): Promise<PushState> {
  if (!REAL_BACKEND) {
    localStorage.removeItem('gymapp.demoPush');
    return 'off';
  }
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await hub.pushUnsubscribe(sub.endpoint).catch(() => undefined);
    await sub.unsubscribe();
  }
  return 'off';
}

export async function testPush(title: string, body: string, icon?: string): Promise<void> {
  if (REAL_BACKEND) {
    await hub.pushTest();
    return;
  }
  const reg = await registration();
  if (reg) await reg.showNotification(title, { body, icon, tag: 'test' });
  else new Notification(title, { body, icon });
}
