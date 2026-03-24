import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import RenderPercentLabel from "./RenderPercentLabel";
function ErrorSuccess({ pieErrorData, COLORS }) {
  const hasData = pieErrorData && pieErrorData.some(entry => entry.value > 0);
  return (
   <div className="admin-card p-3">

            <h6 className="mb-3 text-center">Errors vs Success</h6>
            {hasData ? (
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
            ) : (
              <div className="text-center text-muted py-5">
                No data available for the selected period.
              </div>
            )}

          </div>
  )
}

export default ErrorSuccess
