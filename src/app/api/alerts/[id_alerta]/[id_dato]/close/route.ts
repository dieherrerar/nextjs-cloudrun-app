import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { id_alerta: string; id_dato: string } }
) {
  try {
    await query(
      `INSERT INTO estado_alerta (id_dato_dispositivo, id_alerta, accion, usuario)
       VALUES ($1, $2, 'closed', 'system')`,
      [params.id_dato, params.id_alerta]
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
