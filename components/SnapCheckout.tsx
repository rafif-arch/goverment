"use client";
// Memuat Snap.js (sandbox/produksi sesuai env) & membuka popup pembayaran.
// Client HANYA menampilkan popup — status order diputuskan oleh webhook.
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (r: unknown) => void;
          onPending?: (r: unknown) => void;
          onError?: (r: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const SNAP_SANDBOX = "https://app.sandbox.midtrans.com/snap/snap.js";

export function useSnap() {
  const [ready, setReady] = useState(false);
  const loading = useRef(false);

  useEffect(() => {
    if (window.snap) {
      setReady(true);
      return;
    }
    if (loading.current) return;
    loading.current = true;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
    const script = document.createElement("script");
    script.src = SNAP_SANDBOX;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => setReady(true);
    script.onerror = () => setReady(false);
    document.body.appendChild(script);
  }, []);

  const pay = useCallback((token: string, onDone?: () => void) => {
    window.snap?.pay(token, {
      // callback client hanya untuk UX — saldo/VIP menunggu webhook terverifikasi
      onSuccess: () => onDone?.(),
      onPending: () => onDone?.(),
      onClose: () => onDone?.(),
      onError: () => onDone?.(),
    });
  }, []);

  return { ready, pay };
}
