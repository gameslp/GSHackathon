import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-[#7297c5] transition-all duration-300 cursor-pointer">
      <div className="flex flex-col items-center text-center">
        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
          {category.icon}
        </div>
        <h3 className="text-lg font-bold text-black mb-2">
          {category.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {category.description}
        </p>
        <div className="mt-2 px-3 py-1 bg-[#7297c5] bg-opacity-10 rounded-full">
          <span className="text-sm font-semibold text-[#7297c5]">
            {category.challengeCount} challenges
          </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
