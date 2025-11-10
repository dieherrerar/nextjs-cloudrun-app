// src/app/api/alerts/[id_alerta]/[id_dato]/close/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../../../lib/db";

export async function POST(req: NextRequest) {
  // Ruta esperada: /api/alerts/:id_alerta/:id_dato/close
  const parts = req.nextUrl.pathname.split("/");
  // ["", "api", "alerts", id_alerta, id_dato, "close"]
  const id_alerta = parts[3];
  const id_dato = parts[4];

  if (!id_alerta || !id_dato) {
    return NextResponse.json(
      { ok: false, error: "Ruta inválida" },
      { status: 400 }
    );
  }

  try {
    await query(
      `INSERT INTO estado_alerta (id_dato_dispositivo, id_alerta, accion, usuario)
       VALUES ($1, $2, 'closed', 'system')`,
      [id_dato, id_alerta]
    );
    return NextResponse.json({ ok: true, message: "Alerta cerrada (CLOSE)" });
  } catch (error) {
    console.error("Error al cerrar alerta:", error);
    return NextResponse.json(
      { ok: false, error: "Error al registrar cierre de alerta" },
      { status: 500 }
    );
  }
}
