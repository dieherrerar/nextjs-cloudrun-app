"use client";
import { useEffect, useRef, useState } from "react";
import AlertModal, { type AlertRow } from "./AlertModal";

type NotifyPayload = {
  alert: {
    id_alerta: number;
    nombre_alerta: string;
    id_dato_dispositivo: number;
    nivel_alerta: "bajo" | "medio" | "alto" | "extremo";
    message: string;
    valor: number | null;
    variable: string;
    timestamp: string;
  };
  open_modal: boolean;
};

function mapLevel(nivel: NotifyPayload["alert"]["nivel_alerta"]): AlertRow["level"] {
  if (nivel === "bajo") return "info";
  if (nivel === "medio") return "warning";
  return "critical";
}

export default function AlertsSSEListener() {
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState<AlertRow | null>(null);
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  // cooldown de 10 minutos entre modales
  const initialLast = (() => {
    try {
      if (typeof window === "undefined") return 0;
      const v = window.localStorage.getItem("alert_modal_last_shown_at");
      return v ? Number(v) : 0;
    } catch {
      return 0;
    }
  })();
  const lastShownAtRef = useRef<number>(initialLast);

  // Persist and compare last seen alert key to support F5
  const getLastSeenKey = () => {
    try {
      if (typeof window === "undefined") return "";
      return window.localStorage.getItem("alert_modal_last_seen_key") || "";
    } catch {
      return "";
    }
  };
  const setLastSeenKey = (key: string) => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem("alert_modal_last_seen_key", key);
    } catch {}
  };

  const TEN_MIN = 10 * 60 * 1000;
  const POLL_FALLBACK_MS = 120_000; // respeta el pooling de dashboard

  const canOpenNow = () => Date.now() - (lastShownAtRef.current || 0) >= TEN_MIN;
  const markOpenedNow = () => {
    const now = Date.now();
    lastShownAtRef.current = now;
    try {
      window.localStorage.setItem("alert_modal_last_shown_at", String(now));
    } catch {}
  };

  // Load latest alert on mount and on interval as fallback
  const checkLatestAlert = async () => {
    try {
      const r = await fetch(`/api/mostrar_alertas`, { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      const list = (j?.data as any[]) || [];
      if (!list.length) return;
      const d = list[0] as {
        id_alerta: number;
        id_dato_dispositivo: number;
        nombre_alerta: string;
        tipo_alerta?: string;
        fecha_hora_alerta?: string;
        valor_anomalo?: string;
        columnas_afectadas?: string;
      };
      const key = `${d.id_alerta}:${d.id_dato_dispositivo}:${d.fecha_hora_alerta ?? ""}`;
      if (key && key !== getLastSeenKey()) {
        // Build alert and maybe open respecting cooldown
        const mapped: AlertRow = {
          id_alerta: d.id_alerta,
          id_dato_dispositivo: d.id_dato_dispositivo,
          title: d.nombre_alerta,
          message: `Nueva alerta detectada`,
          level: "warning",
          detalle_tipo_alerta: d.tipo_alerta,
          detalle_fecha_hora_alerta: d.fecha_hora_alerta,
          detalle_valor_anomalo: d.valor_anomalo,
          detalle_columnas_afectadas: d.columnas_afectadas,
        };
        setAlert(mapped);
        // Abrir si pasó cooldown o si aún no hay modal abierto (F5)
        if (canOpenNow() || !openRef.current) {
          setOpen(true);
          markOpenedNow();
          setLastSeenKey(key);
        }
      }
    } catch {}
  };

  useEffect(() => {
    // Initial check so F5 can show pending alert
    checkLatestAlert();

    // SSE subscription
    const es = new EventSource("/api/alerts/stream");
    es.onmessage = (ev) => {
      try {
        const data: NotifyPayload = JSON.parse(ev.data);
        const a = data.alert;
        if (!a) return;

        // Base alert from SSE
        const base: AlertRow = {
          id_alerta: a.id_alerta,
          id_dato_dispositivo: a.id_dato_dispositivo,
          title: a.nombre_alerta,
          message: a.message,
          value: a.valor ?? "",
          variable: a.variable,
          level: mapLevel(a.nivel_alerta),
          ts: a.timestamp,
        };

        // Try to enrich with detalle_alerta
        fetch(
          `/api/mostrar_alertas/one?id_alerta=${encodeURIComponent(
            String(a.id_alerta)
          )}&id_dato_dispositivo=${encodeURIComponent(String(a.id_dato_dispositivo))}`
        )
          .then(async (r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const j = await r.json();
            const d = j?.data as
              | {
                  nombre_alerta: string;
                  tipo_alerta?: string;
                  fecha_hora_alerta?: string;
                  valor_anomalo?: string;
                  columnas_afectadas?: string;
                }
              | undefined;

            const enriched: AlertRow = {
              ...base,
              // Prefer detail values if present
              title: d?.nombre_alerta ?? base.title,
              detalle_tipo_alerta: d?.tipo_alerta,
              detalle_fecha_hora_alerta: d?.fecha_hora_alerta,
              detalle_valor_anomalo: d?.valor_anomalo,
              detalle_columnas_afectadas: d?.columnas_afectadas,
            };

            setAlert(enriched);
          })
          .catch(() => {
            // Fall back to base if detalle fetch fails
            setAlert(base);
          })
          .finally(() => {
            if (!data.open_modal) return;

            // Respetar cooldown de 10 minutos entre modales
            const eventKey = `${a.id_alerta}:${a.id_dato_dispositivo}:${a.timestamp ?? ""}`;
            if (canOpenNow() || (!openRef.current && eventKey !== getLastSeenKey())) {
              setOpen(true);
              markOpenedNow();
              setLastSeenKey(eventKey);
            }
          });
      } catch (e) {
        console.error("Error SSE:", e);
      }
    };

    // Fallback polling aligned with dashboard refresh
    const tid = setInterval(checkLatestAlert, POLL_FALLBACK_MS);

    return () => {
      es.close();
      clearInterval(tid);
    };
  }, []);

  if (!alert) return null;

  return <AlertModal open={open} onClose={() => setOpen(false)} alert={alert} />;
}
