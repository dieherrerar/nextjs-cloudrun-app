// src/app/api/alerts/stream/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { Notification } from "pg";

// Pool local solo para el SSE (no toca tu lib/db)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export async function GET() {
  const client = await pool.connect();
  await client.query("LISTEN new_alert");

  const encoder = new TextEncoder();

  // guardamos referencias para el cleanup
  let hb: ReturnType<typeof setInterval> | null = null;
  let onNotifyRef: ((msg: Notification) => void) | null = null;

  // tipamos el payload que envías en NOTIFY
  type AlertPayload = {
    alert: unknown;
    open_modal: boolean;
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      const onNotify = (msg: Notification) => {
        try {
          // msg.payload puede ser undefined; tratamos como string vacío en ese caso
          const raw = msg.payload ?? "{}";
          const payload: AlertPayload = JSON.parse(raw);
          send(payload);
        } catch (e) {
          // si no parsea, mandamos el string crudo para no romper el stream
          send({ error: "invalid_payload", raw: msg.payload ?? null });
        }
      };

      // suscripción y heartbeat
      // `on` está tipado en pg; `removeListener` existe para limpiar
      client.on("notification", onNotify);
      onNotifyRef = onNotify;
      hb = setInterval(
        () => controller.enqueue(encoder.encode(":\n\n")),
        15000
      );
    },

    cancel() {
      // limpiar listeners y recursos
      if (hb) clearInterval(hb);
      if (onNotifyRef) {
        client.removeListener(
          "notification",
          onNotifyRef as unknown as (...args: unknown[]) => void
        );
        onNotifyRef = null;
      }
      client.release();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

