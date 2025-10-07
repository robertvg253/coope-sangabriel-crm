import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieChartData {
  label: string;
  value: number;
  percentage: number;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function PieChart({ data, title }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value} (${Math.round((value / total) * 100)}%)`, 
                name
              ]}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value: string) => value}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{item.value}</div>
              <div className="text-xs text-gray-500">{item.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

