// src/app/api/mostrar_alertas/one/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id_alerta = searchParams.get("id_alerta");
  const id_dato_dispositivo = searchParams.get("id_dato_dispositivo");

  if (!id_alerta || !id_dato_dispositivo) {
    return NextResponse.json(
      { success: false, error: "Faltan parámetros: id_alerta e id_dato_dispositivo" },
      { status: 400 }
    );
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        d.id_alerta,
        d.id_dato_dispositivo,
        a.nombre_alerta,
        t.nivel_alerta AS tipo_alerta,
        to_char(d.fecha_hora_alerta, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora_alerta,
        d.valor_anomalo::text AS valor_anomalo,
        d.columnas_afectadas
      FROM public.detalle_alerta d
      JOIN public.alerta a       ON d.id_alerta = a.id_alerta
      JOIN public.tipo_alerta t  ON a.id_tipo_alerta = t.id_tipo_alerta
      WHERE d.id_alerta = $1 AND d.id_dato_dispositivo = $2
      ORDER BY d.fecha_hora_alerta DESC
      LIMIT 1;
      `,
      [Number(id_alerta), Number(id_dato_dispositivo)]
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "No se encontró detalle para la alerta" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/mostrar_alertas/one:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Error consultando detalle de alerta",
        detail: process.env.NODE_ENV === "development" ? String(err?.message ?? err) : undefined,
      },
      { status: 500 }
    );
  }
}

