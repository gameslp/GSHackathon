import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';
import ChallengeCard from '@/lib/components/ChallengeCard';
import CategoryCard from '@/lib/components/CategoryCard';
import StatsCard from '@/lib/components/StatsCard';
import { getFeaturedChallenges, getCategories, getPlatformStats } from '@/lib/services/mockData';

export default function Home() {
  const featuredChallenges = getFeaturedChallenges().slice(0, 3);
  const categories = getCategories();
  const platformStats = getPlatformStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-linear-to-br from-[#7297c5] to-[#5a7ba3] text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Compete. Learn. Showcase Your Data Science Skills.
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Join the world&rsquo;s largest community of data scientists and machine learning engineers. 
                Solve real-world problems, win prizes, and advance your career.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" href="/signup">
                  Get Started Free
                </Button>
                <Button variant="outline" size="lg" href="/challenges" className="border-white text-white hover:bg-white hover:text-[#7297c5]">
                  Explore Challenges
                </Button>
              </div>
              
              {/* Stats Preview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
                {platformStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl mb-2">{stat.icon}</div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-white/80">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Challenges Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-black mb-2">
                  Featured Challenges
                </h2>
                <p className="text-gray-600">
                  Start competing in these hot challenges and win amazing prizes
                </p>
              </div>
              <Button variant="outline" href="/challenges">
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-black mb-2">
                Explore by Category
              </h2>
              <p className="text-gray-600">
                Find challenges that match your expertise and interests
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-2">
                How It Works
              </h2>
              <p className="text-gray-600">
                Get started in three simple steps
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#7297c5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold text-black mb-3">Choose a Challenge</h3>
                <p className="text-gray-600">
                  Browse through hundreds of real-world data science problems from top companies and organizations.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-[#7297c5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold text-black mb-3">Build Your Model</h3>
                <p className="text-gray-600">
                  Download datasets, analyze data, and create machine learning models using your favorite tools and frameworks.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-[#7297c5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold text-black mb-3">Submit & Compete</h3>
                <p className="text-gray-600">
                  Submit your predictions, climb the leaderboard, and compete with data scientists worldwide for prizes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-black mb-2">
                Platform Statistics
              </h2>
              <p className="text-gray-600">
                Join a thriving community of data science professionals
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {platformStats.map((stat, index) => (
                <StatsCard key={index} stat={stat} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-black text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Start Your Data Science Journey?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of data scientists competing in challenges, learning from experts, 
              and building their careers on HackathonHub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" href="/signup">
                Join Now - It&rsquo;s Free
              </Button>
              <Button variant="outline" size="lg" href="/learn" className="border-white text-white hover:bg-white hover:text-black">
                Learn More
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
