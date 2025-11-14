import { StatisticCard } from '@/types';

interface StatsCardProps {
  stat: StatisticCard;
}

const StatsCard = ({ stat }: StatsCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
          <p className="text-3xl font-bold text-black mb-1">{stat.value}</p>
          {stat.trend !== undefined && (
            <div className="flex items-center space-x-1">
              <span className="text-green-600 text-sm font-semibold">
                ↑ {stat.trend}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        {stat.icon && (
          <div className="text-4xl opacity-50">
            {stat.icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
