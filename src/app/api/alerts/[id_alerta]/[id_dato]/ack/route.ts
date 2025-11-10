// src/app/api/alerts/[id_alerta]/[id_dato]/ack/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../../../lib/db";

export async function POST(req: NextRequest) {
  // Ruta esperada: /api/alerts/:id_alerta/:id_dato/ack
  const { pathname } = req.nextUrl;

  // Extrae los dos segmentos dinámicos
  const match = pathname.match(/^\/api\/alerts\/([^/]+)\/([^/]+)\/ack\/?$/);
  if (!match) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
  }

  const [, id_alerta, id_dato] = match;

  await query(
    "INSERT INTO estado_alerta(id_dato_dispositivo,id_alerta,accion,usuario) VALUES($1,$2,'acknowledged','admin')",
    [id_dato, id_alerta]
  );

  return NextResponse.json({ ok: true });
}
