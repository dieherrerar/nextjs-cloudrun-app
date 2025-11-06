"use client";

import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Scatter,
  ReferenceDot,
} from "recharts";
import React, { useMemo } from "react";

export type Point = {
  Tem_BME280: number;
  MP1_0_AtE: number;
  cluster: number;
  timestamp: string;
};

export type Centroid = {
  cluster: number;
  Tem_BME280: number;
  MP1_0_AtE: number;
};

interface Props {
  points: Point[];
  centroids: Centroid[];
  title?: string;
}

const palette = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"];

function clusterColor(c: number) {
  return palette[c % palette.length];
}

export default function ClusterScatter({ points, centroids, title }: Props) {
  // Filtrar puntos y centroides con valores -999 o NaN
  const cleanPoints = useMemo(() => {
    const arr = Array.isArray(points) ? points : [];
    return arr.filter((p) => {
      const tx = typeof p.Tem_BME280 === "string" ? parseFloat(p.Tem_BME280 as any) : p.Tem_BME280;
      const ty = typeof p.MP1_0_AtE === "string" ? parseFloat(p.MP1_0_AtE as any) : p.MP1_0_AtE;
      if (tx === -999 || Number.isNaN(tx)) return false;
      if (ty === -999 || Number.isNaN(ty)) return false;
      return true;
    });
  }, [points]);

  const cleanCentroids = useMemo(() => {
    const arr = Array.isArray(centroids) ? centroids : [];
    return arr.filter((c) => {
      const tx = typeof c.Tem_BME280 === "string" ? parseFloat(c.Tem_BME280 as any) : c.Tem_BME280;
      const ty = typeof c.MP1_0_AtE === "string" ? parseFloat(c.MP1_0_AtE as any) : c.MP1_0_AtE;
      if (tx === -999 || Number.isNaN(tx)) return false;
      if (ty === -999 || Number.isNaN(ty)) return false;
      return true;
    });
  }, [centroids]);

  const clusters = Array.from(new Set(cleanPoints.map((p) => p.cluster))).sort(
    (a, b) => a - b
  );

  const series = clusters.map((c) => ({
    name: `Cluster ${c} (n=${cleanPoints.filter((p) => p.cluster === c).length})`,
    color: clusterColor(c),
    data: cleanPoints.filter((p) => p.cluster === c),
  }));

  return (
    <div className="space-y-2">
      <h3 className="h5">{title}</h3>
      <ResponsiveContainer width="100%" height={480}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 80, left: 60 }}>
          <CartesianGrid />

          <XAxis
            type="number"
            dataKey="Tem_BME280"
            // Etiqueta dentro del área para no chocar con la leyenda
            label={{
              value: "Tem_BME280 (°C)",
              position: "insideBottom",
              offset: -5,
            }}
          />
          <YAxis
            type="number"
            dataKey="MP1_0_AtE"
            label={{
              value: "MP1.0_AtE (µg/m³)",
              angle: -90,
              position: "insideLeft",
            }}
          />

          {/* 👇 Leyenda abajo, centrada */}
          <Legend
            verticalAlign="bottom"
            align="center"
            layout="horizontal"
            wrapperStyle={{ bottom: 0 }}
          />

          <Tooltip cursor={{ strokeDasharray: "3 3" }} />

          {series.map((s, idx) => (
            <Scatter key={idx} name={s.name} data={s.data} fill={s.color} />
          ))}
          {cleanCentroids.map((c) => (
            <ReferenceDot
              key={`cent-${c.cluster}`}
              x={c.Tem_BME280}
              y={c.MP1_0_AtE}
              r={10}
              isFront
              stroke="#111"
              fill="transparent"
              label={`C${c.cluster}`}
              // @ts-ignore
              shape="cross"
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
