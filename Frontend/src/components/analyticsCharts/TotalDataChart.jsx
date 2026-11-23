import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import RenderPercentLabel from "./RenderPercentLabel";

export default function TotalDataChart({ pieTotalData, COLORS }) {
  const hasData = pieTotalData && pieTotalData.some(entry => entry.value > 0);
  return (
    <div className="chart-card">
      <div className="chart-card-header d-flex align-items-center gap-2">
        <i className="bi bi-pie-chart" />
        <h6>Total Information</h6>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieTotalData}
              dataKey="value"
              nameKey="name"
              outerRadius={95}
              labelLine={false}
              label={RenderPercentLabel}
            >
              {pieTotalData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty d-flex flex-column align-items-center justify-content-center gap-2">
          <i className="bi bi-inbox" />
          <span>No data available for the selected period.</span>
        </div>
      )}
    </div>
  );
}
