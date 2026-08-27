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
  boxShadow:
    "0 8px 24px color-mix(in oklab, var(--foreground) 8%, transparent)",
};

type RangeTone = "week" | "month" | "quarter";

function rangeTone(length: number): RangeTone {
  if (length <= 7) return "week";
  if (length <= 31) return "month";
  return "quarter";
}

function weekdayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function withChartLabels(series: AnalyticsDayPoint[]) {
  const tone = rangeTone(series.length);
  return series.map((day) => ({
    ...day,
    tick:
      tone === "week"
        ? weekdayLabel(day.date)
        : day.label.replace(/\s+/g, "\u00a0"),
    tipLabel:
      tone === "week"
        ? `${weekdayLabel(day.date)} · ${day.label}`
        : day.label,
  }));
}

function axisInterval(tone: RangeTone) {
  if (tone === "week") return 0;
  if (tone === "month") return "preserveStartEnd" as const;
  return "preserveStartEnd" as const;
}

function axisMinTickGap(tone: RangeTone) {
  if (tone === "week") return 8;
  if (tone === "month") return 22;
  return 36;
}

type ChartRow = ReturnType<typeof withChartLabels>[number];

type FocusMinutesChartProps = {
  series: AnalyticsDayPoint[];
  goalMinutes: number;
};

export function FocusMinutesChart({
  series,
  goalMinutes,
}: FocusMinutesChartProps) {
  const hasFocus = series.some((d) => d.focus_minutes > 0);
  const tone = rangeTone(series.length);
  const data = withChartLabels(series);
  const isWeek = tone === "week";

  return (
    <ChartBlock
      label="Focus"
      description={`Minutes sealed each day · goal ${formatFocusMinutes(goalMinutes)}`}
      heightClassName={isWeek ? "h-60 sm:h-72" : "h-56 sm:h-64"}
    >
      {hasFocus ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 12,
              right: isWeek ? 12 : 4,
              left: isWeek ? 0 : -8,
              bottom: isWeek ? 4 : 0,
            }}
            barCategoryGap={isWeek ? "22%" : tone === "month" ? "18%" : "10%"}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/40"
            />
            <XAxis
              dataKey="tick"
              tick={{
                fontSize: isWeek ? 11 : 10,
                fill: "var(--muted-foreground)",
              }}
              axisLine={false}
              tickLine={false}
              interval={axisInterval(tone)}
              minTickGap={axisMinTickGap(tone)}
              padding={isWeek ? { left: 8, right: 8 } : undefined}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={isWeek ? 36 : 40}
              tickFormatter={(v) =>
                v >= 60 ? `${Math.round(v / 60)}h` : `${v}m`
              }
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", fillOpacity: 0.28 }}
              contentStyle={tooltipStyle}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                return row?.tipLabel ?? "";
              }}
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
                ifOverflow="extendDomain"
              />
            ) : null}
            <Bar
              dataKey="focus_minutes"
              name="Focus"
              radius={isWeek ? [6, 6, 2, 2] : [3, 3, 0, 0]}
              maxBarSize={isWeek ? 56 : tone === "month" ? 22 : 12}
            >
              {data.map((day) => {
                const hit =
                  goalMinutes > 0 && day.focus_minutes >= goalMinutes;
                const empty = day.focus_minutes <= 0;
                return (
                  <Cell
                    key={day.date}
                    fill="var(--foreground)"
                    fillOpacity={
                      empty ? 0.12 : hit ? (isWeek ? 0.95 : 0.9) : isWeek ? 0.55 : 0.4
                    }
                  />
                );
              })}
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
  const tone = rangeTone(series.length);
  const isWeek = tone === "week";
  const data = withChartLabels(series).map((day) => ({
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
      heightClassName={isWeek ? "h-48" : "h-44"}
    >
      {hasHabits ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 8,
              right: isWeek ? 12 : 4,
              left: isWeek ? 0 : -8,
              bottom: isWeek ? 4 : 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/35"
            />
            <XAxis
              dataKey="tick"
              tick={{
                fontSize: isWeek ? 11 : 10,
                fill: "var(--muted-foreground)",
              }}
              axisLine={false}
              tickLine={false}
              interval={axisInterval(tone)}
              minTickGap={axisMinTickGap(tone)}
              padding={isWeek ? { left: 8, right: 8 } : undefined}
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
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                return row?.tipLabel ?? "";
              }}
              formatter={(value) => [`${value}%`, "Completion"]}
            />
            <Area
              type={isWeek ? "monotone" : "monotone"}
              dataKey="rate"
              name="Completion"
              stroke="var(--foreground)"
              fill="var(--foreground)"
              fillOpacity={isWeek ? 0.14 : 0.1}
              strokeWidth={isWeek ? 2.25 : 1.75}
              strokeOpacity={0.8}
              dot={
                isWeek
                  ? {
                      r: 3.5,
                      fill: "var(--background)",
                      stroke: "var(--foreground)",
                      strokeWidth: 1.5,
                      strokeOpacity: 0.85,
                    }
                  : false
              }
              activeDot={{ r: 4 }}
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
  const tone = rangeTone(series.length);
  const isWeek = tone === "week";
  const data = withChartLabels(series);

  return (
    <ChartBlock
      label="Mood & energy"
      description="From daily reviews · 1–5"
      heightClassName={isWeek ? "h-48" : "h-44"}
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
            data={data}
            margin={{
              top: 8,
              right: isWeek ? 12 : 4,
              left: isWeek ? 0 : -8,
              bottom: isWeek ? 4 : 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/30"
            />
            <XAxis
              dataKey="tick"
              tick={{
                fontSize: isWeek ? 11 : 10,
                fill: "var(--muted-foreground)",
              }}
              axisLine={false}
              tickLine={false}
              interval={axisInterval(tone)}
              minTickGap={axisMinTickGap(tone)}
              padding={isWeek ? { left: 8, right: 8 } : undefined}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              width={28}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                return row?.tipLabel ?? "";
              }}
            />
            <Line
              type="monotone"
              dataKey="mood"
              name="Mood"
              stroke="var(--foreground)"
              strokeWidth={isWeek ? 2.25 : 1.75}
              strokeOpacity={0.9}
              dot={
                isWeek
                  ? {
                      r: 3.5,
                      fill: "var(--background)",
                      stroke: "var(--foreground)",
                      strokeWidth: 1.5,
                    }
                  : false
              }
              activeDot={{ r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="energy"
              name="Energy"
              stroke="var(--muted-foreground)"
              strokeWidth={isWeek ? 2 : 1.5}
              strokeOpacity={0.8}
              strokeDasharray="4 4"
              dot={
                isWeek
                  ? {
                      r: 3,
                      fill: "var(--background)",
                      stroke: "var(--muted-foreground)",
                      strokeWidth: 1.5,
                    }
                  : false
              }
              activeDot={{ r: 4 }}
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
