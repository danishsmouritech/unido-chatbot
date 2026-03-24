import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import RenderPercentLabel from "./RenderPercentLabel";
function TotalDataChart({ pieTotalData, COLORS }) {
  const hasData = pieTotalData && pieTotalData.some(entry => entry.value > 0);
  return (
     <div className="admin-card p-3">
                  <h6 className="mb-3 text-center">Total Information</h6>
              {hasData ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
      
                      <Pie
                        data={pieTotalData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
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
                <div className="text-center text-muted py-5">
                  No data available for the selected period.
                </div>
              )}
      
                </div>
  )
}

export default TotalDataChart
