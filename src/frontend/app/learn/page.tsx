'use client';

import Header from '@/lib/components/Header';
import Footer from '@/lib/components/Footer';
import Button from '@/lib/components/Button';

export default function LearnPage() {
  const resources = [
    {
      category: 'Getting Started',
      items: [
        {
          title: 'Introduction to Machine Learning',
          description: 'Learn the fundamentals of ML, from basic concepts to model building.',
          level: 'Beginner',
          duration: '2 hours',
          icon: '📚',
        },
        {
          title: 'Python for Data Science',
          description: 'Master Python libraries essential for data analysis and ML.',
          level: 'Beginner',
          duration: '3 hours',
          icon: '🐍',
        },
        {
          title: 'Setting Up Your Environment',
          description: 'Configure your development environment with all necessary tools.',
          level: 'Beginner',
          duration: '1 hour',
          icon: '⚙️',
        },
      ],
    },
    {
      category: 'Core Skills',
      items: [
        {
          title: 'Data Preprocessing & Feature Engineering',
          description: 'Learn how to clean, transform, and create features from raw data.',
          level: 'Intermediate',
          duration: '4 hours',
          icon: '🔧',
        },
        {
          title: 'Model Selection & Evaluation',
          description: 'Understand different ML algorithms and how to evaluate their performance.',
          level: 'Intermediate',
          duration: '5 hours',
          icon: '📊',
        },
        {
          title: 'Deep Learning Fundamentals',
          description: 'Dive into neural networks and deep learning architectures.',
          level: 'Advanced',
          duration: '6 hours',
          icon: '🧠',
        },
      ],
    },
    {
      category: 'Competition Strategies',
      items: [
        {
          title: 'Kaggle Competition Masterclass',
          description: 'Learn winning strategies from top Kaggle competitors.',
          level: 'Advanced',
          duration: '4 hours',
          icon: '🏆',
        },
        {
          title: 'Ensemble Methods & Model Stacking',
          description: 'Combine multiple models to achieve better predictions.',
          level: 'Advanced',
          duration: '3 hours',
          icon: '🎯',
        },
        {
          title: 'Time Series Forecasting',
          description: 'Master techniques for temporal data prediction.',
          level: 'Intermediate',
          duration: '5 hours',
          icon: '📈',
        },
      ],
    },
  ];

  const learningPaths = [
    {
      title: 'Classification Expert',
      description: 'Master classification problems from beginner to advanced level',
      courses: 8,
      hours: 32,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Computer Vision Specialist',
      description: 'Learn image processing, object detection, and advanced CV techniques',
      courses: 12,
      hours: 48,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'NLP Practitioner',
      description: 'From text preprocessing to transformer models and language understanding',
      courses: 10,
      hours: 40,
      color: 'bg-green-100 text-green-800',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
                Learn Data Science & ML
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Master the skills you need to compete and win. From beginner tutorials to
                advanced techniques used by top competitors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" href="#courses">
                  Browse Courses
                </Button>
                <Button variant="outline" size="lg" href="#paths">
                  View Learning Paths
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Paths */}
        <section id="paths" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-2">Learning Paths</h2>
              <p className="text-gray-600">
                Structured curricula to take you from beginner to expert
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {learningPaths.map((path, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${path.color}`}>
                    Learning Path
                  </div>
                  <h3 className="text-xl font-bold text-black mb-3">{path.title}</h3>
                  <p className="text-gray-600 mb-4">{path.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>{path.courses} courses</span>
                    <span>•</span>
                    <span>{path.hours} hours</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Start Learning
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Courses by Category */}
        <section id="courses" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-2">Courses & Tutorials</h2>
              <p className="text-gray-600">
                Learn at your own pace with our comprehensive course library
              </p>
            </div>

            <div className="max-w-6xl mx-auto space-y-12">
              {resources.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  <h3 className="text-2xl font-bold text-black mb-6">{section.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="text-4xl mb-4">{item.icon}</div>
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              item.level === 'Beginner'
                                ? 'bg-green-100 text-green-800'
                                : item.level === 'Intermediate'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.level}
                          </span>
                          <span className="text-xs text-gray-500">{item.duration}</span>
                        </div>
                        <h4 className="text-lg font-bold text-black mb-2">{item.title}</h4>
                        <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                        <Button variant="outline" size="sm" className="w-full">
                          Start Course
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-2">Additional Resources</h2>
              <p className="text-gray-600">External resources to boost your learning</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <a
                href="https://www.kaggle.com/learn"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow text-center"
              >
                <div className="text-3xl mb-3">📘</div>
                <h4 className="font-bold text-black mb-2">Kaggle Learn</h4>
                <p className="text-sm text-gray-600">Free micro-courses on ML</p>
              </a>

              <a
                href="https://www.coursera.org/browse/data-science"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow text-center"
              >
                <div className="text-3xl mb-3">🎓</div>
                <h4 className="font-bold text-black mb-2">Coursera</h4>
                <p className="text-sm text-gray-600">University-level courses</p>
              </a>

              <a
                href="https://www.fast.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow text-center"
              >
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="font-bold text-black mb-2">Fast.ai</h4>
                <p className="text-sm text-gray-600">Practical deep learning</p>
              </a>

              <a
                href="https://paperswithcode.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow text-center"
              >
                <div className="text-3xl mb-3">📄</div>
                <h4 className="font-bold text-black mb-2">Papers with Code</h4>
                <p className="text-sm text-gray-600">Latest research & code</p>
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-black text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Put your new skills to the test by competing in real challenges and winning prizes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" href="/challenges">
                Browse Challenges
              </Button>
              <Button variant="outline" size="lg" href="/signup">
                Create Account
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
