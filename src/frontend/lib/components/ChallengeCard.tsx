/* eslint-disable @next/next/no-img-element */
import { Challenge } from '@/types';
import Button from './Button';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ChallengeCardProps {
  challenge: Challenge;
}

const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-blue-100 text-blue-800',
    Advanced: 'bg-orange-100 text-orange-800',
    Expert: 'bg-red-100 text-red-800',
  };

  const formatPrize = (prize: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(prize);
  };

  const formatParticipants = (participants: number) => {
    return new Intl.NumberFormat('en-US').format(participants);
  };

  const thumbnailUrl = challenge.thumbnailUrl
    ? challenge.thumbnailUrl.startsWith('http')
      ? challenge.thumbnailUrl
      : `${API_BASE_URL}${challenge.thumbnailUrl}`
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="relative h-48">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${challenge.title} thumbnail`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full bg-linear-to-br from-[#7297c5] to-[#5a7ba3] flex items-center justify-center">
            <div className="text-6xl mb-2">
              {challenge.category === 'Classification' && '🎯'}
              {challenge.category === 'Regression' && '📈'}
              {challenge.category === 'NLP' && '💬'}
              {challenge.category === 'Computer Vision' && '👁️'}
              {challenge.category === 'Time Series' && '⏱️'}
              {challenge.category === 'Other' && '🔬'}
            </div>
          </div>
        )}
        {challenge.status === 'upcoming' && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-semibold">
            Coming Soon
          </div>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${difficultyColors[challenge.difficulty]}`}>
            {challenge.difficulty}
          </span>
          <span className="text-xs text-gray-500">{challenge.category}</span>
        </div>
        
        <h3 className="text-lg font-bold text-black mb-2 line-clamp-2">
          {challenge.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
          {challenge.description}
        </p>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Prize Pool</span>
            <span className="font-bold text-[#7297c5]">{formatPrize(challenge.prize)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Participants</span>
            <span className="font-semibold text-black">
              {challenge.status === 'upcoming' ? 'TBA' : formatParticipants(challenge.participants)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {challenge.status === 'upcoming' ? 'Starts in' : 'Ends in'}
            </span>
            <span className="font-semibold text-black">{challenge.daysRemaining} days</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-[#7297c5] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {challenge.organizerName.charAt(0)}
            </div>
            <span className="text-xs text-gray-600">{challenge.organizerName}</span>
          </div>
          
          <Button 
            variant="primary" 
            size="sm"
            href={`/challenges/${challenge.id}`}
          >
            View Challenge
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
