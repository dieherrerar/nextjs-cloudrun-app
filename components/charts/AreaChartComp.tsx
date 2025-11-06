import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { StackedDatum } from "../../types/dashboard";

interface AreaDef {
  key: keyof StackedDatum;
  name?: string;
}

interface AreaChartCompProps {
  title?: string;
  data: StackedDatum[];
  areas?: AreaDef[];
  xKey: keyof StackedDatum;
  height?: number | string;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

export default function AreaChartComp(props: AreaChartCompProps) {
  const {
    title,
    data,
    xKey = "date",
    areas = [
      { key: "co2", name: "CO2" },
      { key: "nh3", name: "NH3" },
    ],
    height = 220,
  } = props;
  
  // Limpia valores -999 y NaN por serie; valida eje X
  const cleanedData = useMemo(() => {
    const xK = String(xKey);
    const areaKeys = areas.map((a) => String(a.key));
    const arr = Array.isArray(data) ? data : [];
    return arr
      .filter((d) => {
        const xVal: any = (d as any)?.[xK];
        if (xVal === undefined || xVal === null || xVal === "") return false;
        if (xVal === -999 || xVal === "-999") return false;
        return true;
      })
      .map((d) => {
        const clone: any = { ...d };
        for (const k of areaKeys) {
          const raw = (clone as any)?.[k];
          const num = typeof raw === "string" ? parseFloat(raw) : raw;
          if (num === -999 || Number.isNaN(num)) clone[k] = null;
        }
        return clone;
      });
  }, [data, xKey, areas]);
  return (
    <div className="area-card p-2 h-100">
      <div className="small text-muted">{title}</div>
      <div className="area-card-body p-2">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={cleanedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={String(xKey)} />
            <YAxis />
            <Tooltip />
            <Legend />
            {areas.map((a, i) => (
              <Area
                key={String(a.key)}
                type="monotone"
                dataKey={String(a.key)}
                stackId="1"
                name={a.name || String(a.key)}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
