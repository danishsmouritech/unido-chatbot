import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import RenderPercentLabel from "./RenderPercentLabel";
function MessageDistribution({ pieMessageData, COLORS }) {
  return (
      <div className="admin-card p-3">
                  <h6 className="mb-3">Message Distribution</h6>
      
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
      
                      <Pie
                        data={pieMessageData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        labelLine={false}
                        label={RenderPercentLabel}
                      >
                        {pieMessageData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index]} />
                        ))}
                      </Pie>
      
                      <Tooltip  />
                      <Legend />
      
                    </PieChart>
                  </ResponsiveContainer>
      
                </div>
  )
}

export default MessageDistribution
