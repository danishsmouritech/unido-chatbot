import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import RenderPercentLabel from "./RenderPercentLabel";

export default function ErrorSuccess({ pieErrorData, COLORS }) {
  const hasData = pieErrorData && pieErrorData.some(entry => entry.value > 0);
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <i className="bi bi-shield-check" />
        <h6>Errors vs Success</h6>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieErrorData}
              dataKey="value"
              nameKey="name"
              outerRadius={95}
              labelLine={false}
              label={RenderPercentLabel}
            >
              {pieErrorData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index + 2]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">
          <i className="bi bi-inbox" />
          <span>No data available for the selected period.</span>
        </div>
      )}
    </div>
  );
}
