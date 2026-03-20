import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import RenderPercentLabel from "./RenderPercentLabel";
function ErrorSuccess({ pieErrorData, COLORS }) {
  return (
   <div className="admin-card p-3">

            <h6 className="mb-3">Errors vs Success</h6>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>

                <Pie
                  data={pieErrorData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
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

          </div>
  )
}

export default ErrorSuccess
