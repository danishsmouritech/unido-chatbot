import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import RenderPercentLabel from "./RenderPercentLabel";
function TotalDataChart({pieTotalData, COLORS}) {
  return (
     <div className="admin-card p-3">
                  <h6 className="mb-3">Total Data</h6>
      
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
      
                </div>
  )
}

export default TotalDataChart
