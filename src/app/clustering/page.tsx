"use client";
import { useEffect, useState } from "react";
import DownloadPDF from "../../../components/DownloadPDF";
import Cluster3D from "../../../components/charts/Cluster3D";
import FullPageLoader from "../../../components/FullPageLoader";
// Alertas eliminadas en esta vista; se muestran en el dashboard

const POLL_MS = 120_000;

export default function ClusterrPage() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [points, setPoints] = useState<any[]>([]);
  const [centroids, setCentroids] = useState<any[]>([]);
  const [features, setFeatures] = useState<string[]>([
    "Tem_BME280",
    "MP1.0_AtE",
    "CO2_MHZ19",
    "Rap_Viento",
  ]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Rango de fechas (misma lógica que dashboard)
  const [pendingStartDate, setPendingStartDate] = useState<string>("");
  const [pendingEndDate, setPendingEndDate] = useState<string>("");
  const [appliedStartDate, setAppliedStartDate] = useState<string>("");
  const [appliedEndDate, setAppliedEndDate] = useState<string>("");

  // Fecha de hoy en formato YYYY-MM-DD
  const todayStr = (() => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  // Verificar si el usuario es admin
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/validate", { cache: "no-store" });
        const j = await res.json();
        setIsAdmin(j?.isAdmin === true);
      } catch {
        setIsAdmin(false);
      }
    }
    checkAuth();
  }, []);

  // Extrae las fechas disponibles en la base de datos
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dates", { cache: "no-store" });
        const json = await res.json();
        if (json.success && Array.isArray(json.dates) && json.dates.length > 0) {
          setDates(json.dates);
          setSelectedDate(json.dates[json.dates.length - 1]); // última fecha
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Inicializa el rango con la misma lógica del dashboard
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

  const handleApplyFilter = () => {
    if (!pendingStartDate || !pendingEndDate) return;
    setAppliedStartDate(pendingStartDate);
    setAppliedEndDate(pendingEndDate);
  };

  // Carga datos cuando cambia el rango aplicado
  useEffect(() => {
    (async () => {
      if (!appliedStartDate || !appliedEndDate) return;
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams({ start: appliedStartDate, end: appliedEndDate });
        const r = await fetch(`/api/clusters?${params.toString()}`, {
          cache: "no-store",
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Error al cargar clusters");
        setPoints(j.points ?? []);
        setCentroids(j.centroids ?? []);
        if (Array.isArray(j.features) && j.features.length >= 4) {
          setFeatures(j.features);
        }
      } catch (e: any) {
        setErr(e.message ?? "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [appliedStartDate, appliedEndDate]);

  // Polling periódico según rango aplicado
  useEffect(() => {
    if (!appliedStartDate || !appliedEndDate) return;

    const id = setInterval(async () => {
      try {
        const params = new URLSearchParams({ start: appliedStartDate, end: appliedEndDate });
        const r = await fetch(`/api/clusters?${params.toString()}`, {
          cache: "no-store",
        });
        const j = await r.json();
        if (r.ok) {
          setPoints(j.points ?? []);
          setCentroids(j.centroids ?? []);
          if (Array.isArray(j.features) && j.features.length >= 4) {
            setFeatures(j.features);
          }
        }
      } catch (err) {
        console.warn("Error actualizando clusters:", err);
      }
    }, POLL_MS);

    return () => clearInterval(id);
  }, [appliedStartDate, appliedEndDate]);

  if (loading) {
    return <FullPageLoader message={"Cargando gráfico de patrones..."} />;
  }

  return (
    <div>
      <div className="container py-4" id="cluster-root">
        {/* Título con misma jerarquía visual */}
        <h2 className="mb-3 text-center">
          Patrones Ambientales Detectados (Clusters y Centroides)
        </h2>

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

        {/* Gráfico 3D (X=Tem, Y=MP1.0, Z=CO2, Tamaño=Rap_Viento) */}
        <div className="dashboard-chart-container">
          <Cluster3D
            points={points}
            centroids={centroids}
            features={features}
            xKey="Tem_BME280"
            yKey="MP1.0_AtE"
            zKey="CO2_MHZ19"
            sizeKey="Rap_Viento"
            title=""
          />
        </div>
      </div>

      {!isAdmin && (
        <div id="ButtonPDF" className="mb-4">
          <div className="container">
            <div className="d-flex gap-3 flex-wrap">
              <DownloadPDF
                targetId="container py-4"
                fileName={"eco_clustering_" + appliedStartDate + "_a_" + appliedEndDate}
                hideSelectors={["#fecha", "#ButtonPDF"]}
                btnClassName="dashboard-btn-blue"
              />
            </div>
          </div>
        </div>
      )}
      {/* AlertModal se muestra solo en el Dashboard */}
    </div>
  );
}
