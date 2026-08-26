"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsDayPoint } from "@/types/analytics";
import { formatFocusMinutes } from "@/types/focus";

type ChartBlockProps = {
  label: string;
  description?: string;
  children: React.ReactNode;
  heightClassName?: string;
};

function ChartBlock({
  label,
  description,
  children,
  heightClassName = "h-56",
}: ChartBlockProps) {
  return (
    <section className="w-full">
      <div className="text-center sm:text-left">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={`mt-4 w-full ${heightClassName}`}>{children}</div>
    </section>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
};

type FocusMinutesChartProps = {
  series: AnalyticsDayPoint[];
  goalMinutes: number;
};

export function FocusMinutesChart({
  series,
  goalMinutes,
}: FocusMinutesChartProps) {
  const hasFocus = series.some((d) => d.focus_minutes > 0);

  return (
    <ChartBlock
      label="Focus"
      description={`Minutes sealed each day · goal ${formatFocusMinutes(goalMinutes)}`}
    >
      {hasFocus ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={series}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/60"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={36}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [
                formatFocusMinutes(Number(value) || 0),
                "Focus",
              ]}
            />
            {goalMinutes > 0 ? (
              <ReferenceLine
                y={goalMinutes}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeOpacity={0.45}
              />
            ) : null}
            <Bar
              dataKey="focus_minutes"
              name="Focus"
              fill="var(--foreground)"
              fillOpacity={0.85}
              radius={[3, 3, 0, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Seal focus sessions to see the pattern.
        </div>
      )}
    </ChartBlock>
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
  const hasHabits = series.some((d) => d.habits_total > 0);

  return (
    <ChartBlock
      label="Habits"
      description="% of habits checked each day"
      heightClassName="h-40"
    >
      {hasHabits ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/50"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              width={36}
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
              stroke="var(--foreground)"
              fill="var(--foreground)"
              fillOpacity={0.12}
              strokeWidth={1.75}
              strokeOpacity={0.7}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Add habits to track consistency.
        </div>
      )}
    </ChartBlock>
  );
}

type MoodEnergyChartProps = {
  series: AnalyticsDayPoint[];
};

export function MoodEnergyChart({ series }: MoodEnergyChartProps) {
  const hasData = series.some((d) => d.mood !== null || d.energy !== null);

  return (
    <ChartBlock
      label="Mood & energy"
      description="From daily reviews · 1–5"
      heightClassName="h-40"
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/40"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              domain={[1, 5]}
              width={28}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="mood"
              name="Mood"
              stroke="var(--foreground)"
              strokeWidth={1.75}
              strokeOpacity={0.85}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="energy"
              name="Energy"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeOpacity={0.7}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Log daily reviews to see mood and energy.
        </div>
      )}
    </ChartBlock>
  );
}
