// frontend/src/pages/Home.jsx
import React from "react";
import { motion } from "framer-motion";

// ✅ Simple Button
const Button = ({ children, className = "", ...props }) => (
  <button
    className={`bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-md transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

// ✅ Simple Card
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

// ✅ Simple ChevronDown Icon (inline SVG)
const ChevronDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 inline-block ml-2 text-gray-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function Home() {
  return (
    <div className="bg-gray-50 text-gray-900">
      {/* ✅ Hero Section */}
      <section className="py-20 px-6 md:px-20 text-center bg-white border-b border-gray-200">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-extrabold mb-6 text-blue-700"
        >
          Welcome to LifeMap 🌍
        </motion.h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-700 mb-8">
          Your personal career roadmap builder. Plan your journey, break it into
          milestones, and achieve your goals with clarity and confidence.
        </p>
        <Button className="text-lg px-8 py-4">Get Started</Button>
      </section>

      {/* ✅ About Section */}
      <section className="py-16 px-6 md:px-20 text-center bg-gray-50">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold mb-6"
        >
          About LifeMap
        </motion.h2>
        <p className="text-lg max-w-3xl mx-auto text-gray-700 leading-relaxed">
          LifeMap helps you take control of your personal and professional
          growth. Whether you want to learn a new skill, land your dream job,
          or start a business, LifeMap gives you the structure you need. 
          <br /><br />
          With visual roadmaps, milestone tracking, and a supportive
          community, you’ll never feel lost or unmotivated again.
        </p>
      </section>

      {/* ✅ Why Choose LifeMap Section */}
      <section className="py-16 px-6 md:px-20 bg-white border-y border-gray-200">
        <h2 className="text-4xl font-bold text-center mb-12">Why Choose LifeMap?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Clarity & Direction",
              desc: "Turn vague ambitions into structured roadmaps with milestones you can follow step by step.",
            },
            {
              title: "Stay Motivated",
              desc: "Celebrate progress as you achieve milestones and see your growth visually.",
            },
            {
              title: "Community Support",
              desc: "Connect with like-minded people, share experiences, and learn from others’ journeys.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <h3 className="text-2xl font-semibold text-blue-600 mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ✅ Who Is LifeMap For Section */}
      <section className="py-16 px-6 md:px-20 bg-gray-50">
        <h2 className="text-4xl font-bold text-center mb-12">Who Is LifeMap For?</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            {
              icon: "🎓",
              title: "Students",
              desc: "Plan your academic path, prepare for exams, and set goals for higher education or career entry.",
            },
            {
              icon: "💼",
              title: "Professionals",
              desc: "Track promotions, skill upgrades, certifications, and career shifts with a clear roadmap.",
            },
            {
              icon: "🚀",
              title: "Entrepreneurs",
              desc: "Map out your startup journey — from idea to launch to scaling your business successfully.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-2xl font-semibold text-blue-600 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ✅ How It Works Section */}
      <section className="py-16 px-6 md:px-20 bg-white border-t border-gray-200">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            {
              step: "1",
              title: "Define Your Goal 🎯",
              desc: "Set a clear objective that you want to achieve.",
            },
            {
              step: "2",
              title: "Break It Down 🛤️",
              desc: "Split your big goal into smaller, realistic milestones.",
            },
            {
              step: "3",
              title: "Track Progress ✅",
              desc: "Use visual progress tracking tools to stay motivated.",
            },
            {
              step: "4",
              title: "Connect & Share 🌍",
              desc: "Engage with others pursuing similar journeys.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-blue-600 mb-2">
                Step {item.step}: {item.title}
              </h3>
              <p className="text-gray-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ✅ FAQ Section */}
      <section className="py-16 px-6 md:px-20 bg-gray-50 border-t border-gray-200">
        <h2 className="text-4xl font-bold text-center mb-10">FAQ</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: "Is LifeMap free to use?",
              a: "Yes, LifeMap is free to use for individuals. Optional premium features may be added later.",
            },
            {
              q: "Can I collaborate with others?",
              a: "Yes, the upcoming community feature will allow shared roadmaps and teamwork.",
            },
            {
              q: "How does progress tracking work?",
              a: "You can create milestones under each goal and mark them as completed when achieved.",
            },
          ].map((faq, i) => (
            <Card key={i}>
              <CardContent>
                <details className="cursor-pointer">
                  <summary className="flex justify-between items-center text-lg font-semibold">
                    {faq.q} <ChevronDown />
                  </summary>
                  <p className="mt-3 text-gray-600">{faq.a}</p>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ✅ Call to Action Footer */}
      <section className="py-20 px-6 md:px-20 text-center bg-white border-t border-gray-200">
        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold mb-6 text-blue-700"
        >
          Start Your Journey Today 🚀
        </motion.h2>
        <p className="mb-8 text-lg text-gray-700 max-w-2xl mx-auto">
          Build your career roadmap, stay consistent, and achieve your dreams
          step by step with LifeMap.
        </p>
        <Button className="text-lg px-8 py-4">Sign Up Now</Button>
      </section>
    </div>
  );
}
