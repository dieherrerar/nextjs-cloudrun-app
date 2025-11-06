"use client";

import React, { useEffect, useRef, useState, useCallback } from "react"; // ✅ ADD useCallback
import "./alertas.css";
import FullPageLoader from "../../../components/FullPageLoader";

type Alerta = {
  nombre_alerta: string;
  tipo_alerta: string;
  fecha_hora_alerta: string;
  valor_anomalo: string;
  columnas_afectadas?: string | null;
};

export default function Alertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastSigRef = useRef<string | null>(null);

  const makeSignature = (rows: Alerta[]) =>
    rows
      .map(
        (r) =>
          `${r.fecha_hora_alerta}|${r.nombre_alerta}|${r.tipo_alerta}|${
            r.valor_anomalo
          }|${r.columnas_afectadas ?? ""}`
      )
      .join("~");
  // ✅ Envuelto en useCallback para referencia estable
  const fetchAlertas = useCallback(async () => {
    try {
      const res = await fetch("/api/mostrar_alertas", { cache: "no-store" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Error desconocido");

      const nextSig = makeSignature(json.data);
      const changed = nextSig !== lastSigRef.current;

      if (changed) {
        lastSigRef.current = nextSig;
        setAlertas(json.data);

        // ✅ Solo mostrar "Actualizando alertas..." si no es la primera carga
        if (!loading) {
          setIsRefreshing(true);
          setTimeout(() => setIsRefreshing(false), 3000);
        }
      }
    } catch (e: any) {
      setErr(e?.message ?? "Error de red");
    } finally {
      setLoading(false);
    }
  }, [loading]); // 👈 pequeño detalle: agrega loading como dependencia

  useEffect(() => {
    fetchAlertas(); // carga inicial
    const interval = setInterval(fetchAlertas, 60000); // cada 1 min
    return () => clearInterval(interval);
  }, [fetchAlertas]); // ✅ ahora la referencia es estable, no da warning

  return (
    <div className="container py-4">
      <h2 className="mb-3 text-center">Alertas</h2>
      {isRefreshing && (
        <div className="refresh-banner">🔄 Actualizando alertas...</div>
      )}
      {loading && <FullPageLoader message={"Cargando alertas..."} />}
      {err && <p className="al-error">{err}</p>}
      {!loading && !err && (
        <div className="table-responsive dashboard-chart-container small-padding">
          <table className="table w-100">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Alerta</th>
                <th>Tipo de Alerta</th>
                <th>Columnas con error</th>
                <th>Valor Anómalo</th>
              </tr>
            </thead>
            <tbody>
              {alertas.map((a, i) => (
                <tr key={i}>
                  <td>{a.fecha_hora_alerta}</td>
                  <td>{a.nombre_alerta}</td>
                  <td>{a.tipo_alerta}</td>
                  <td>{a.columnas_afectadas ?? "-"}</td>
                  <td>{a.valor_anomalo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="al-hint">Mostrando las últimas 20 alertas</p>
        </div>
      )}
    </div>
  );
}
