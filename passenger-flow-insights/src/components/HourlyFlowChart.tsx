import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ================= API TYPE ================= */
interface HourlyFlowRow {
  hour: string;   // "06:00"
  entry: number;
  exit: number;
}

interface HourlyFlowChartProps {
  data: HourlyFlowRow[];
  theme?: string;
}

/* ================= COMPONENT ================= */
export function HourlyFlowChart({ data, theme }: HourlyFlowChartProps) {
  const isDark = theme === "dark";

  const colors = {
    grid: isDark ? "hsl(222, 30%, 25%)" : "hsl(214, 32%, 91%)",
    text: isDark ? "hsl(215, 20%, 65%)" : "hsl(215, 16%, 47%)",
    entry: isDark ? "hsl(174, 72%, 56%)" : "hsl(174, 72%, 40%)",
    exit: isDark ? "hsl(16, 85%, 60%)" : "hsl(16, 85%, 55%)",
    tooltipBg: isDark ? "hsl(222, 47%, 14%)" : "hsl(0, 0%, 100%)",
    tooltipBorder: isDark ? "hsl(222, 30%, 25%)" : "hsl(214, 32%, 91%)",
    tooltipText: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
  };

  return (
    <div
      className="glass-card rounded-lg p-6 animate-slide-up"
      style={{ animationDelay: "200ms" }}
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Hourly Passenger Flow
      </h3>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {/* -------- Gradients -------- */}
            <defs>
              <linearGradient id="colorEntry" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.entry} stopOpacity={0.4} />
                <stop offset="95%" stopColor={colors.entry} stopOpacity={0} />
              </linearGradient>

              <linearGradient id="colorExit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.exit} stopOpacity={0.4} />
                <stop offset="95%" stopColor={colors.exit} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* -------- Grid -------- */}
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />

            {/* -------- Axes -------- */}
            <XAxis
              dataKey="hour"
              stroke={colors.text}
              tick={{ fill: colors.text, fontSize: 12 }}
              axisLine={{ stroke: colors.grid }}
              label={{
                value: "Hours",
                position: "insideBottom",
                offset: -5,
                fill: colors.text,
                fontSize: 12,
              }}
            />

            <YAxis
              stroke={colors.text}
              tick={{ fill: colors.text, fontSize: 12 }}
              axisLine={{ stroke: colors.grid }}
              label={{
                value: "Passenger Count",
                angle: -90,
                position: "insideLeft",
                fill: colors.text,
                fontSize: 12,
              }}
            />

            {/* -------- Tooltip -------- */}
            <Tooltip
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: "8px",
                color: colors.tooltipText,
              }}
              labelStyle={{ color: colors.tooltipText }}
            />

            {/* -------- Legend -------- */}
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span style={{ color: colors.text }}>{value}</span>
              )}
            />

            {/* -------- Areas -------- */}
            <Area
              type="monotone"
              dataKey="entry"
              name="Boarding (Entry)"
              stroke={colors.entry}
              strokeWidth={2}
              fill="url(#colorEntry)"
            />

            <Area
              type="monotone"
              dataKey="exit"
              name="Alighting (Exit)"
              stroke={colors.exit}
              strokeWidth={2}
              fill="url(#colorExit)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
