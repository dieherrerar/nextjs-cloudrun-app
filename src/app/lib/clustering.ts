export type FeatureName = string;

export interface MinMaxParams {
  feature_order: FeatureName[];
  data_min_: number[];
  data_max_: number[];
}

export interface ScaledCentroid {
  cluster: number;
  values: number[];
}

export function minMaxScale(x: number[], p: MinMaxParams): number[] {
  return x.map((xi, i) => {
    const range = p.data_max_[i] - p.data_min_[i];
    return range === 0 ? 0 : (xi - p.data_min_[i]) / range;
  });
}

export function minMaxInverse(z: number[], p: MinMaxParams): number[] {
  return z.map(
    (zi, i) => zi * (p.data_max_[i] - p.data_min_[i]) + p.data_min_[i]
  );
}

function sqEuclid(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

export function assignClusterScaled(
  xScaled: number[],
  centroids: ScaledCentroid[]
): number {
  let best = -1,
    bestD = Infinity;
  for (const c of centroids) {
    const d = sqEuclid(xScaled, c.values);
    if (d < bestD) {
      bestD = d;
      best = c.cluster;
    }
  }
  return best;
}
