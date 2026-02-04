"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#006B3F] to-[#008B52]" />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center">
              <span
                className={`text-sm font-medium ${trend.isPositive ? "text-[#006B3F]" : "text-red-600"}`}
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-sm text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-gradient-to-br from-[#006B3F]/10 to-[#008B52]/10 rounded-xl text-[#006B3F]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
