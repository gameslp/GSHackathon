import { StatisticCard } from '@/types';
import { TrophyIcon, UsersIcon, DollarIcon, ChartIcon } from './icons/StatsIcons';

interface StatsCardProps {
  stat: StatisticCard;
}

const iconMap: Record<string, React.ReactNode> = {
  'trophy': <TrophyIcon />,
  'users': <UsersIcon />,
  'dollar': <DollarIcon />,
  'chart': <ChartIcon />,
};

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
          <div className="opacity-50">
            {iconMap[stat.icon as string] || null}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
