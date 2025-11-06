// src/app/api/alerts/[id_alerta]/[id_dato]/ack/route.ts
import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";

export async function POST(
  _: Request,
  { params }: { params: { id_alerta: string; id_dato: string } }
) {
  await query(
    "INSERT INTO estado_alerta(id_dato_dispositivo,id_alerta,accion,usuario) VALUES($1,$2,'acknowledged','admin')",
    [params.id_dato, params.id_alerta]
  );
  return NextResponse.json({ ok: true });
}
