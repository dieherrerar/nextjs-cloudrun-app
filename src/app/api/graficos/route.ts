import { NextResponse } from "next/server";
import { query } from "../../lib/db";

export async function GET() {
  try {
    const result = await query(
      "SELECT id_grafico, titulo_grafico, activo FROM grafico WHERE id_grafico BETWEEN 2 AND 5 ORDER BY titulo_grafico ASC;"
    );

    const data = result.rows.map((row) => ({
      id_grafico: row.id_grafico,
      titulo_grafico: row.titulo_grafico,
      activo: row.activo,
    }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "Error obteniendo graficos" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Array<{
      id_grafico: number;
      activo: number;
    }>;
    if (
      !Array.isArray(body) ||
      body.some(
        (x) =>
          typeof x.id_grafico !== "number" ||
          typeof x.activo !== "number" ||
          ![1, 2].includes(x.activo)
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Payload Inválido" },
        { status: 400 }
      );
    }

    try {
      await query("BEGIN;");
      for (const { id_grafico, activo } of body) {
        await query(
          `UPDATE grafico
           SET activo = $1
           WHERE id_grafico = $2;`,
          [activo, id_grafico]
        );
      }

      await query("COMMIT;");
      return NextResponse.json({ success: true });
    } catch (e: any) {
      await query("ROLLBACK;");
      return NextResponse.json(
        { success: false, error: e?.message ?? "Error actualizando graficos" },
        { status: 500 }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "Error procesando solicitud" },
      { status: 500 }
    );
  }
}
