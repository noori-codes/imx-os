"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  footer?: React.ReactNode;
};

function ChartBlock({
  label,
  description,
  children,
  heightClassName = "h-56 sm:h-64",
  footer,
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
      <div className={`mt-5 w-full ${heightClassName}`}>{children}</div>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </section>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid color-mix(in oklab, var(--border) 80%, transparent)",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 8px 24px color-mix(in oklab, var(--foreground) 8%, transparent)",
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
            margin={{ top: 12, right: 4, left: -12, bottom: 0 }}
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
              minTickGap={series.length > 40 ? 36 : 24}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={40}
              tickFormatter={(v) =>
                v >= 60 ? `${Math.round(v / 60)}h` : `${v}`
              }
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", fillOpacity: 0.35 }}
              contentStyle={tooltipStyle}
              labelFormatter={(label) => String(label)}
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
                strokeOpacity={0.5}
                ifOverflow="extendDomain"
              />
            ) : null}
            <Bar
              dataKey="focus_minutes"
              name="Focus"
              radius={[3, 3, 0, 0]}
              maxBarSize={series.length > 40 ? 10 : 20}
            >
              {series.map((day) => (
                <Cell
                  key={day.date}
                  fill="var(--foreground)"
                  fillOpacity={
                    goalMinutes > 0 && day.focus_minutes >= goalMinutes
                      ? 0.92
                      : 0.38
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground">
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
      heightClassName="h-44"
    >
      {hasHabits ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
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
              minTickGap={series.length > 40 ? 36 : 24}
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
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              contentStyle={tooltipStyle}
              formatter={(value) => [`${value}%`, "Completion"]}
            />
            <Area
              type="monotone"
              dataKey="rate"
              name="Completion"
              stroke="var(--foreground)"
              fill="var(--foreground)"
              fillOpacity={0.1}
              strokeWidth={1.75}
              strokeOpacity={0.75}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground">
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
      heightClassName="h-44"
      footer={
        hasData ? (
          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground sm:justify-start">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-3 bg-foreground/80" aria-hidden />
              Mood
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-px w-3 border-t border-dashed border-muted-foreground"
                aria-hidden
              />
              Energy
            </span>
          </div>
        ) : null
      }
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series}
            margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/30"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={series.length > 40 ? 36 : 24}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
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
              activeDot={{ r: 3 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="energy"
              name="Energy"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeOpacity={0.75}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground">
          Log daily reviews to see mood and energy.
        </div>
      )}
    </ChartBlock>
  );
}
