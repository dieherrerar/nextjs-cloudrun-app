import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import { CompositionDatum } from "../../types/dashboard";

interface PieChartCompProps {
  title: string;
  data: CompositionDatum[];
  nameKey?: keyof CompositionDatum;
  valueKey?: keyof CompositionDatum;
  height?: number | string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function PieChartComp(props: PieChartCompProps) {
  const {
    title,
    data,
    nameKey = "name",
    valueKey = "value",
    height = 220,
  } = props;

  // Filtra -999/NaN y nombres vacíos
  const chartData = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    const nK = String(nameKey);
    const vK = String(valueKey);
    return arr
      .filter((d: any) => {
        const name = d?.[nK];
        const raw = d?.[vK];
        const num = typeof raw === "string" ? parseFloat(raw) : raw;
        if (name === undefined || name === null || name === "") return false;
        if (num === -999 || Number.isNaN(num)) return false;
        return true;
      })
      .map((d) => ({
        [nK]: (d as any)[nK],
        [vK]: (d as any)[vK],
      })) as { [key: string]: any }[];
  }, [data, nameKey, valueKey]);

  return (
    <div className="pie-card p-2 h-100">
      <div className="small text-muted">{title}</div>
      <div className="pie-card-body p-2">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey={String(valueKey)}
              nameKey={String(nameKey)}
              outerRadius={70}
              label
            >
              {chartData.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
