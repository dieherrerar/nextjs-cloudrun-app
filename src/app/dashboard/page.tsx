"use client";

import React, { useEffect, useState, useRef } from "react";
import type { NextPage } from "next";
import KpiCard from "../../../components/KpiCard";
import LineChartComp from "../../../components/charts/LineChartComp";
import BarChartComp from "../../../components/charts/BarChartComp";
import PieChartComp from "../../../components/charts/PieChartComp";
import AreaChartComp from "../../../components/charts/AreaChartComp";
import type {
  CompositionDatum,
  DashboardPayload,
} from "../../../types/dashboard";
import Table from "../../../components/Table";
import DownloadButton from "../../../components/DownloadCSV";
import DownloadPDF from "../../../components/DownloadPDF";
import "./dashboard.css";
import dynamic from "next/dynamic";
import AdminChartPicker from "../../../components/AdminChartPicker";
import FullPageLoader from "../../../components/FullPageLoader";

// ⬇️ Listener de alertas (SSE) solo en cliente
const AlertsSSEListener = dynamic(
  () => import("../../../components/AlertsSSEListener"),
  { ssr: false }
);

const POLL_MS = 120_000; //2 minutos

type ToastState = { show: boolean; message: string };

type GraficoItem = {
  id_grafico: number;
  titulo_grafico: string;
  activo: number;
};

const DashboardPage: NextPage = () => {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [pendingStartDate, setPendingStartDate] = useState<string>("");
  const [pendingEndDate, setPendingEndDate] = useState<string>("");
  const [appliedStartDate, setAppliedStartDate] = useState<string>("");
  const [appliedEndDate, setAppliedEndDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [datosDiccionario, setDatosDiccionario] = useState<
    { variable: string; descripcion: string; rango: string }[]
  >([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [graficos, setGraficos] = useState<GraficoItem[]>([]);
  const [chartVisibility, setChartVisibility] = useState({
    AreaChartComp: true,
    BarChartComp: true,
    LineChartComp: true,
    PieChartComp: true,
  });
  const [draft, setDraft] = useState<GraficoItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "" });

  // Fecha de hoy en formato YYYY-MM-DD (hora local)
  const todayStr = (() => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  

  //Carga visibilidad de los graficos desde el servidor
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/graficos", { cache: "no-store" });
        const j = await res.json();
        if (!j.success) throw new Error(j.error || "Error cargando gráficos");
        setGraficos(j.data);
        setDraft(j.data);
      } catch (e) {
        console.warn("Error cargando gráficos: ", e);
      }
    })();
  }, []);

  //Manejar guardado de visibilidad en el draft
  const handleToggle = (id_graficos: number) => {
    setDraft((prev) => {
      const next = prev.map((g) =>
        Number(g.id_grafico) === id_graficos
          ? { ...g, activo: g.activo === 1 ? 2 : 1 }
          : g
      );
      setIsDirty(JSON.stringify(next) !== JSON.stringify(graficos));
      return next;
    });
  };

  //Guarda los cambios guardados en el draft en la BD
  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const payload = draft.map(({ id_grafico, activo }) => ({
        id_grafico: Number(id_grafico),
        activo: Number(activo) === 1 ? 1 : 2,
      }));
      const res = await fetch("/api/graficos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      console.log("Respuesta del PUT:", j);
      if (!j?.success) throw new Error(j?.error || "Error guardando cambios");
      setGraficos(draft);
      setIsDirty(false);
      setToast({ show: true, message: "Cambios guardados exitosamente" });
      setTimeout(() => setToast({ show: false, message: "" }), 2500);
    } catch (e) {
      console.error(e);
      setToast({ show: true, message: "Error al guardar los cambios" });
      setTimeout(() => setToast({ show: false, message: "" }), 2500);
    } finally {
      setSaving(false);
    }
  };

  //Cancelar los cambios del draft
  const handleCancel = () => {
    setDraft(graficos);
    setIsDirty(false);
  };

  useEffect(() => {
    // cuando cargues graficos desde GET
    if (graficos.length === 0) return;
    const byId = new Map(graficos.map((g) => [Number(g.id_grafico), g.activo]));
    setChartVisibility({
      AreaChartComp: byId.get(5) === 1,
      BarChartComp: byId.get(3) === 1,
      LineChartComp: byId.get(2) === 1,
      PieChartComp: byId.get(4) === 1,
    });
  }, [graficos]);

  const inFlight = useRef<AbortController | null>(null);

  //verificar si es admin
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/validate", { cache: "no-store" });
        const j = await res.json();
        setIsAdmin(j?.valid === true);
      } catch {
        setIsAdmin(false);
      }
    }
    checkAuth();
  }, []);

  //cargar fechas desde la BD
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/dates", { cache: "no-store" });
        const jsonr = await response.json();
        if (jsonr.success && jsonr.dates.length > 0) {
          setDates(jsonr.dates);
          setSelectedDate(jsonr.dates[jsonr.dates.length - 1]); // última fecha
          setError(null);
        } else {
          setError("No hay fechas disponibles.");
        }
      } catch (err) {
        setError("Error obteniendo fechas.");
      } finally {
      }
    })();
  }, []);

  // Inicializa el rango: fin = min(hoy, última fecha BD), inicio ajustado para no superar fin
  useEffect(() => {
    if (selectedDate) {
      const end = todayStr < selectedDate ? todayStr : selectedDate;
      const start = selectedDate > end ? end : selectedDate;
      setPendingStartDate(start);
      setPendingEndDate(end);
      setAppliedStartDate(start);
      setAppliedEndDate(end);
    }
  }, [selectedDate, todayStr]);

  // Acción del botón "Filtrar"
  const handleApplyFilter = () => {
    if (!pendingStartDate || !pendingEndDate) return;
    setAppliedStartDate(pendingStartDate);
    setAppliedEndDate(pendingEndDate);
  };

  // Cargar datos según rango aplicado
  useEffect(() => {
    (async () => {
      if (!appliedStartDate || !appliedEndDate) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ start: appliedStartDate, end: appliedEndDate });
        const res = await fetch(`/api/dashboard-data?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("No se pudo obtener el dashboard");
        const json = (await res.json()) as DashboardPayload;
        setData(json);
      } catch (err: any) {
        setError(err?.message || "Error cargando los datos del dashboard.");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [appliedStartDate, appliedEndDate]);

  //Polling automatico cada 2 minutos
  useEffect(() => {
    if (!appliedStartDate || !appliedEndDate) return;

    const intervalID = setInterval(async () => {
      try {
        const params = new URLSearchParams({ start: appliedStartDate, end: appliedEndDate });
        const res = await fetch(`/api/dashboard-data?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = (await res.json()) as DashboardPayload;
          setData(json);
        }
      } catch (err) {
        console.error("Error actualizando dashboard: ", err);
      }
    }, POLL_MS);

    return () => clearInterval(intervalID);
  }, [appliedStartDate, appliedEndDate]);

  //Diccionario de datos
  useEffect(() => {
    (async () => {
      const resp = await fetch("api/diccionario-datos");
      const jsronres = await resp.json();
      if (jsronres.success) {
        setDatosDiccionario(jsronres.datos);
      }
    })();
  }, []);

  const avg = data?.kpis?.avgPM10 ?? 0;

  const pm25Bars: CompositionDatum[] = [
    { name: "Promedio del periodo", value: avg },
    { name: "Limite OMS 24 h", value: 130 },
  ];

  //mensaje de carga y errores
  if (loading)
    return <FullPageLoader message={"Cargando el Dashboard Ambiental..."} />;
  if (!data)
    return (
      <div className="container py-4 text-danger">
        No se pudieron cargar los datos.
      </div>
    );

  const { kpis, composition, stacked } = data;

  const kpisForPdf = [
    { id_kpi: 1, label: "MP2.5_ATE promedio hoy", value: kpis?.avgPM25 ?? "-" },
    { id_kpi: 2, label: "Temperatura promedio", value: kpis?.avgTemp ?? "-" },
    { id_kpi: 3, label: "CO₂ máximo", value: kpis?.maxCO2 ?? "-" },
    {
      id_kpi: 4,
      label: "Precipitación acumulada",
      value: kpis?.aguaCaida ?? "-",
    },
  ];

  return (
    <div className="container py-4">
      {toast.show && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 2000 }}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="toast show align-items-center text-bg-success border-0 shadow">
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Close"
                onClick={() => setToast({ show: false, message: "" })}
              />
            </div>
          </div>
        </div>
      )}
      <h2 className="mb-3 text-center">Dashboard Ambiental</h2>

      {/* Selector de rango de fechas y botón de filtrado */}
      <div className="mb-4 d-flex gap-2 align-items-end flex-wrap">
        <div>
          <label htmlFor="fecha-inicio" className="form-label small">Fecha inicio</label>
          <input
            id="fecha-inicio"
            type="date"
            className="form-control"
            min={dates[0]}
            max={dates[dates.length - 1]}
            value={pendingStartDate}
            onChange={(e) => setPendingStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="fecha-fin" className="form-label small">Fecha fin</label>
          <input
            id="fecha-fin"
            type="date"
            className="form-control"
            min={dates[0]}
            max={dates[dates.length - 1]}
            value={pendingEndDate}
            onChange={(e) => setPendingEndDate(e.target.value)}
          />
        </div>
        <div>
          <button
            className="dashboard-btn-blue"
            onClick={handleApplyFilter}
            disabled={!pendingStartDate || !pendingEndDate}
          >
            Filtrar
          </button>
        </div>
      </div>

      <div className="row">
        <div className={isAdmin ? "col-12 col-lg-9" : "col-12"}>
          {/* KPIs */}
          <div id="kpis-dashboard" className="row g-3 mb-3">
            <div className="col-6 col-md-3">
              <KpiCard
                title="MP2.5_ATE promedio"
                value={kpis?.avgPM25 ?? "-"}
                subtitle="µg/m³"
              />
            </div>
            <div className="col-6 col-md-3">
              <KpiCard
                title="Temperatura promedio"
                value={kpis?.avgTemp ?? "-"}
                subtitle="°C"
              />
            </div>
            <div className="col-6 col-md-3">
              <KpiCard
                title="CO₂ máximo"
                value={kpis?.maxCO2 ?? "-"}
                subtitle="ppm"
              />
            </div>
            <div className="col-6 col-md-3">
              <KpiCard
                title="Precipitación acumulada"
                value={kpis?.aguaCaida ?? "-"}
                subtitle="mm"
              />
            </div>
          </div>

          {/* Gráficos */}
          <div className="row g-3">
            {chartVisibility.LineChartComp && (
              <div className="col-12 col-lg-6">
                <div id="chart-line" className="dashboard-chart-container">
                  <LineChartComp
                    data={data.tempCo2Trend}
                    xKey="tempBin"
                    yKey="co2"
                    xType="number"
                    title={`Relación CO₂ vs Temperatura`}
                    xLabel="Temperatura (°C)"
                    yLabel="CO₂ (ppm)"
                  />
                </div>
              </div>
            )}

            {chartVisibility.BarChartComp && (
              <div className="col-12 col-lg-6">
                <div id="chart-bar" className="dashboard-chart-container">
                  <BarChartComp
                    data={pm25Bars}
                    title={`PM promedio del día vs límite OMS`}
                  />
                </div>
              </div>
            )}

            {chartVisibility.PieChartComp && (
              <div className="col-12 col-lg-6">
                <div id="chart-pie" className="dashboard-chart-container">
                  <PieChartComp
                    title="Distribución porcentual de partículas MP"
                    data={composition}
                    nameKey="name"
                    valueKey="value"
                  />
                </div>
              </div>
            )}

            {chartVisibility.AreaChartComp && (
              <div className="col-12 col-lg-6">
                <div id="chart-area" className="dashboard-chart-container">
                  <AreaChartComp
                    data={stacked}
                    xKey="date"
                    areas={[
                      { key: "co2", name: "CO2" },
                      { key: "consumo", name: "consumo" },
                    ]}
                    title="CO2 vs Consumo a lo largo del tiempo"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Si no es admin, mostrar botones de descarga. */}
          {!isAdmin && (
            <div className="mb-4 d-flex gap-3 flex-wrap">
              <DownloadButton label="Extraer reporte CSV" start={appliedStartDate} end={appliedEndDate} />
              <DownloadPDF
                date={selectedDate}
                kpis={kpisForPdf}
                graficos={graficos}
                chartNodeIds={{
                  2: "#chart-line",
                  3: "#chart-bar",
                  4: "#chart-pie",
                  5: "#chart-area",
                }}
                kpiNodeId="#kpis-dashboard"
              />
            </div>
          )}

          <h2 className="mt-5 mb-3">Diccionario de Datos</h2>
          <div
            id="diccionario-datos"
            className="table-responsive mt-3 mb-5 dashboard-chart-container"
          >
            <Table datos={datosDiccionario} />
          </div>

          <AlertsSSEListener />
        </div>

        {/* Right column: checklist / admin picker */}
        {isAdmin && (
          <aside className="col-12 col-lg-3">
            <div className="admin-checklist p-2 p-lg-3">
              <div className="sticky-side">
                <AdminChartPicker
                  title={"Seleccionar Gráficos"}
                  graficos={draft}
                  onToggleGrafico={handleToggle}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  hasChanges={isDirty}
                  saving={saving}
                />
                <div className="mt-2 small text-muted">
                  {saving ? "Guardando cambios..." : " "}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
