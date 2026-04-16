import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export type PushStatus = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

export function usePushNotification() {
  const [status, setStatus] = useState<PushStatus>('unsubscribed');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied'); return;
    }
    // 현재 구독 여부 확인
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription()
    ).then((sub) => {
      setStatus(sub ? 'subscribed' : 'unsubscribed');
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    setIsLoading(true);
    try {
      // 권한 요청
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus('denied'); return; }

      // Service Worker 등록
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // VAPID 공개키 가져오기
      const { data } = await api.get<{ success: true; data: { publicKey: string } }>('/push/vapid-public-key');
      const applicationServerKey = urlBase64ToUint8Array(data.data.publicKey);

      // 구독
      const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      const sub = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

      await api.post('/push/subscribe', { endpoint: sub.endpoint, keys: sub.keys });
      setStatus('subscribed');
    } catch (err) {
      console.error('Push subscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.post('/push/unsubscribe', { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setStatus('unsubscribed');
    } catch (err) {
      console.error('Push unsubscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { status, isLoading, subscribe, unsubscribe };
}
