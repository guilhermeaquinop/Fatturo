"use client";

// Gráfico do faturamento acumulado no ano contra o limite (README do design system, "Gráficos").
// Equivale a um componente Blade com um gráfico em JavaScript (Chart.js, por exemplo).
// Linha do faturamento em accent-strong com área surface-tint, projeção pontilhada na
// mesma cor, limite em linha tracejada ink e DAS pago acumulado em brand-deep.
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarReaisInteiros } from "@/lib/dinheiro";

export type PontoDoGrafico = {
  /** Nome curto do mês: "jan". */
  mes: string;
  /** Acumulado até o mês, em centavos; null nos meses que ainda não chegaram. */
  acumulado: number | null;
  /** Acumulado projetado, em centavos; null fora do trecho projetado. */
  projecao: number | null;
  /** DAS pago acumulado até o mês, em centavos; null nos meses que ainda não chegaram. */
  das: number | null;
};

type GraficoAcumuladoProps = {
  pontos: PontoDoGrafico[];
  limiteCentavos: number;
  /** Índice (0 a 11) do ponto que recebe o marcador de valor atual, ou null. */
  indiceAtual: number | null;
};

const ROTULO = { fontSize: 12, fill: "var(--ink-muted)" };

export function GraficoAcumulado({ pontos, limiteCentavos, indiceAtual }: GraficoAcumuladoProps) {
  const maior = Math.max(
    limiteCentavos,
    ...pontos.map((ponto) => Math.max(ponto.acumulado ?? 0, ponto.projecao ?? 0)),
  );

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={pontos} margin={{ top: 20, right: 12, bottom: 0, left: 12 }}>
          <XAxis
            dataKey="mes"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={ROTULO}
          />
          {/* Sem eixo Y visível: os valores aparecem no rótulo do limite e ao passar o mouse. */}
          <YAxis hide domain={[0, Math.ceil(maior * 1.08)]} />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            formatter={(valor, nome) => [
              formatarReaisInteiros(Number(valor)),
              nome === "projecao" ? "Projeção" : nome === "das" ? "DAS pago" : "Faturamento",
            ]}
            contentStyle={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              boxShadow: "none",
              fontSize: 12,
              color: "var(--ink)",
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <ReferenceLine
            y={limiteCentavos}
            stroke="var(--ink)"
            strokeWidth={1}
            strokeDasharray="6 6"
            label={{
              value: `Limite ${formatarReaisInteiros(limiteCentavos)}`,
              position: "insideBottomLeft",
              fontSize: 12,
              fontWeight: 600,
              fill: "var(--ink)",
            }}
          />
          <Area
            type="linear"
            dataKey="acumulado"
            stroke="var(--accent-strong)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="var(--surface-tint)"
            fillOpacity={1}
            isAnimationActive={false}
            activeDot={{ r: 5, fill: "var(--surface)", stroke: "var(--accent-strong)", strokeWidth: 3 }}
            // Só o valor atual ganha marcador: círculo branco com borda accent-strong.
            dot={({ cx, cy, index }) =>
              index === indiceAtual && typeof cx === "number" && typeof cy === "number" ? (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill="var(--surface)"
                  stroke="var(--accent-strong)"
                  strokeWidth={3}
                />
              ) : (
                <g key={index} />
              )
            }
          />
          <Line
            type="linear"
            dataKey="das"
            stroke="var(--brand-deep)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={{ r: 4, fill: "var(--surface)", stroke: "var(--brand-deep)", strokeWidth: 3 }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="projecao"
            stroke="var(--accent-strong)"
            strokeWidth={3}
            strokeDasharray="2 7"
            strokeLinecap="round"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
