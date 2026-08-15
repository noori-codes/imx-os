"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsDayPoint } from "@/types/analytics";

type ChartCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 h-64 w-full">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
};

type ProductivityChartProps = {
  series: AnalyticsDayPoint[];
};

export function ProductivityChart({ series }: ProductivityChartProps) {
  return (
    <ChartCard
      title="Productivity"
      description="Tasks completed and focus minutes per day"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="tasks_completed"
            name="Tasks done"
            fill="var(--primary)"
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
          />
          <Bar
            dataKey="focus_minutes"
            name="Focus min"
            fill="oklch(0.65 0.12 230)"
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

type HabitCompletionChartProps = {
  series: AnalyticsDayPoint[];
};

export function HabitCompletionChart({ series }: HabitCompletionChartProps) {
  const data = series.map((day) => ({
    ...day,
    rate:
      day.habits_total > 0
        ? Math.round((day.habits_done / day.habits_total) * 100)
        : 0,
  }));

  return (
    <ChartCard
      title="Habit consistency"
      description="% of habits checked each day"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value}%`, "Completion"]}
          />
          <Area
            type="monotone"
            dataKey="rate"
            name="Completion"
            stroke="oklch(0.62 0.15 145)"
            fill="oklch(0.62 0.15 145 / 25%)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

type MoodEnergyChartProps = {
  series: AnalyticsDayPoint[];
};

export function MoodEnergyChart({ series }: MoodEnergyChartProps) {
  const hasData = series.some((d) => d.mood !== null || d.energy !== null);

  return (
    <ChartCard
      title="Mood & energy"
      description="From daily reviews (1–5 scale)"
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis tick={{ fontSize: 10 }} domain={[1, 5]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="mood"
              name="Mood"
              stroke="oklch(0.65 0.15 45)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="energy"
              name="Energy"
              stroke="oklch(0.55 0.14 280)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Log daily reviews to see mood and energy trends.
        </div>
      )}
    </ChartCard>
  );
}
