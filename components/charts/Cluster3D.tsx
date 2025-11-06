"use client";

import dynamic from "next/dynamic";
import React, { useMemo } from "react";

declare module "react-plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type GenericPoint = {
  cluster: number;
  timestamp: string;
  [key: string]: number | string;
};

type GenereicCentroid = {
  cluster: number;
  [key: string]: number;
};

interface Cluster3DProps {
  points: GenericPoint[];
  centroids: GenereicCentroid[];
  features: string[];
  title?: string;
  xKey?: string;
  yKey?: string;
  zKey?: string;
  sizeKey?: string;
}

const palette = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
];
const colorByCluster = (c: number) => palette[c % palette.length];

export default function Cluster3D(props: Cluster3DProps) {
  const { points, centroids, features, title, xKey, yKey, zKey, sizeKey } =
    props;

  const X = xKey ?? features[0];
  const Y = yKey ?? features[1];
  const Z = zKey ?? features[2];

  const toNum = (v: any) =>
    typeof v === "string" ? parseFloat(v as any) : (v as number);

  // ✅ filtra puntos inválidos (NaN / -999) sobre points (no centroides)
  const cleanPoints = useMemo(() => {
    const arr = Array.isArray(points) ? points : [];
    return arr.filter((p: any) => {
      const a = toNum(p[X]),
        b = toNum(p[Y]),
        c = toNum(p[Z]);
      return ![a, b, c].some((v) => v === -999 || Number.isNaN(v));
    });
  }, [points, X, Y, Z]);

  const clusters = Array.from(
    new Set(cleanPoints.map((p: any) => p.cluster))
  ).sort((a: any, b: any) => a - b);

  // 🔹 una traza por cluster, tamaño fijo para todos los puntos
  const tracesPoints = clusters.map((c) => {
    const data = cleanPoints.filter((p: any) => p.cluster === c);
    return {
      type: "scatter3d" as const,
      mode: "markers",
      name: `Cluster ${c} (n=${data.length})`,
      x: data.map((d: any) => toNum(d[X])),
      y: data.map((d: any) => toNum(d[Y])),
      z: data.map((d: any) => toNum(d[Z])),
      marker: {
        color: colorByCluster(c),
        size: 6, // 👈 tamaño fijo
        opacity: 0.85,
        line: { color: "rgba(0,0,0,0.25)", width: 0.5 },
        symbol: "circle",
      },
      hovertemplate:
        `${X}: %{x:.2f}<br>` +
        `${Y}: %{y:.2f}<br>` +
        `${Z}: %{z:.2f}<br>` +
        `cluster: ${c}<extra></extra>`,
    };
  });

  return (
    <div className="space-y-2">
      <h3 className="h5">{title}</h3>
      <Plot
        data={[...tracesPoints] as any}
        layout={{
          autosize: true,
          height: 520,
          margin: { l: 0, r: 0, b: 40, t: 10 },
          scene: {
            xaxis: { title: { text: X } },
            yaxis: { title: { text: Y } },
            zaxis: { title: { text: Z } },
            aspectmode: "cube",
          },
          legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.05 },
        }}
        config={{
          displaylogo: false,
          responsive: true,
          modeBarButtonsToRemove: ["lasso2d", "select2d"],
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
