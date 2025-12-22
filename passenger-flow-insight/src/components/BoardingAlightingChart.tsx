import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ================= API TYPE ================= */
interface HourlyFlowRow {
  hour: string;
  entry: number;
  exit: number;
}

interface BoardingAlightingChartProps {
  data: HourlyFlowRow[];
  theme?: string;
}

/* ================= COMPONENT ================= */
export function BoardingAlightingChart({
  data,
  theme,
}: BoardingAlightingChartProps) {

  const isDark = theme === "dark";

  const colors = {
    grid: isDark ? "hsl(222, 30%, 25%)" : "hsl(214, 32%, 91%)",
    text: isDark ? "hsl(215, 20%, 65%)" : "hsl(215, 16%, 47%)",
    entry: isDark ? "hsl(174, 72%, 56%)" : "hsl(174, 72%, 40%)",
    exit: isDark ? "hsl(16, 85%, 60%)" : "hsl(16, 85%, 55%)",
    tooltipBg: isDark ? "hsl(222, 47%, 14%)" : "hsl(0, 0%, 100%)",
    tooltipBorder: isDark ? "hsl(222, 30%, 25%)" : "hsl(214, 32%, 91%)",
    tooltipText: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
    cursor: isDark ? "hsl(222, 30%, 18%)" : "hsl(214, 32%, 95%)",
  };

  /* Show every 2 hours to reduce clutter */
  const filteredData = data.filter((_, index) => index % 2 === 0);

  return (
    <div
      className="glass-card rounded-lg p-6 animate-slide-up"
      style={{ animationDelay: "300ms" }}
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Boarding vs Alighting Comparison
      </h3>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
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
              cursor={{ fill: colors.cursor }}
            />

            {/* -------- Legend -------- */}
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span style={{ color: colors.text }}>{value}</span>
              )}
            />

            {/* -------- Bars -------- */}
            <Bar
              dataKey="entry"
              name="Boarding"
              fill={colors.entry}
              radius={[4, 4, 0, 0]}
            />

            <Bar
              dataKey="exit"
              name="Alighting"
              fill={colors.exit}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
