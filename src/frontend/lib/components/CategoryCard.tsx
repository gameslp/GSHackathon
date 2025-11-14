import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-[#7297c5] transition-all duration-300 cursor-pointer h-full">
      <div className="flex flex-col items-center text-center h-full">
        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
          {category.icon}
        </div>
        <h3 className="text-lg font-bold text-black mb-2">
          {category.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 grow">
          {category.description}
        </p>
        <div className="mt-auto px-4 py-2 bg-primary rounded-full">
          <span className="text-sm font-semibold text-white">
            {category.challengeCount} challenges
          </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
