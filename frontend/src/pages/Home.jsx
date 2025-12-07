// frontend/src/pages/Home.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Users,
  Settings,
  TrendingUp,
  UserCheck,
  Calendar,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

/* -------------------- Reusable UI -------------------- */
const Button = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`px-6 py-3 rounded-xl font-medium shadow-md transition bg-blue-600 text-white hover:bg-blue-700 ${className}`}
  >
    {children}
  </button>
);

const SectionTitle = ({ eyebrow, title, subtitle }) => (
  <div className="text-center max-w-3xl mx-auto">
    {eyebrow && (
      <p className="text-xs tracking-widest uppercase text-blue-600 mb-2">
        {eyebrow}
      </p>
    )}
    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
    {subtitle && (
      <p className="mt-4 text-gray-600 dark:text-gray-300">{subtitle}</p>
    )}
  </div>
);

const Card = ({ className = "", children }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition dark:border-gray-700 dark:bg-gray-800 ${className}`}
  >
    {children}
  </motion.div>
);

/* FAQ Accordion with smooth animation */
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <button
        className="w-full flex items-center justify-between text-left p-5"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          {q}
        </span>
        <ChevronDown
          className={`h-5 w-5 transition-transform ${open ? "rotate-180 text-blue-600" : "text-gray-500 dark:text-gray-400"}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 text-gray-600 dark:text-gray-300">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* -------------------- Page -------------------- */
export default function Home() {
  return (
    <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">

      {/* 1) Hero */}
        <section className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col justify-center items-center text-center px-6">
          {/* subtle background orbs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-blue-100 dark:bg-blue-800 blur-3xl opacity-60" />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-blue-100 dark:bg-blue-800 blur-3xl opacity-60" />
          </div>

          <motion.h1  
            className="relative z-10 text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Build Your Career Path with <span className="text-blue-600 dark:text-blue-400">LifeMap</span>
          </motion.h1>

          <motion.p
            className="relative z-10 mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Plan goals, break them into milestones, track progress visually, and connect with mentors & peers — all in one place.
          </motion.p>

          <motion.div
            className="relative z-10 mt-8 flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button className="text-base sm:text-lg px-6 sm:px-8 py-3">Get Started</Button>
            <a
              href="#about"
              className="px-6 sm:px-8 py-3 rounded-xl font-medium shadow-sm border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition"
            >
              Learn More
            </a>
          </motion.div>

          {/* micro trust badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" /> No credit card required
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Private & secure
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" /> 5-minute setup
            </span>
          </div>
        </section>

      {/* 2) Services */}
      <section id="services" className="py-20 px-6 bg-gray-50 dark:bg-gray-800">
        <SectionTitle
          eyebrow="What we offer"
          title="Our Services"
          subtitle="Everything you need to map, manage, and achieve your goals."
        />
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {[
            { icon: Map, title: "Visual Roadmapping", desc: "Design interactive roadmaps for each goal. Drag, reorder, and color-code milestones for instant clarity." },
            { icon: Users, title: "Community Support", desc: "Join groups, share progress, and learn from peers following similar paths and industries." },
            { icon: Settings, title: "Smart Tools", desc: "Use AI-assisted suggestions to break complex goals into actionable, time-bound steps." },
            { icon: TrendingUp, title: "Progress Tracker", desc: "View streaks, completion rates, and milestone timelines to stay accountable and motivated." },
            { icon: UserCheck, title: "Mentor Connect", desc: "Find mentors by domain, availability, and expertise. Book slots and track mentor feedback." },
            { icon: Calendar, title: "Personal Planner", desc: "Sync deadlines to a simple weekly planner. Get gentle reminders before milestones are due." },
          ].map((s, i) => (
            <Card key={i} className="p-6">
              <s.icon className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl sm:text-2xl font-semibold dark:text-gray-100">{s.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 3) Why Choose */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-800">
        <SectionTitle
          eyebrow="Why LifeMap"
          title="Clarity, Momentum, Community"
          subtitle="We combine visual planning, gentle accountability, and supportive networks."
        />
        <div className="mt-12 grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {[
            { title: "Structure without friction", desc: "Use ready-made templates for common goals. Edit on the fly with zero setup overhead." },
            { title: "Momentum you can see", desc: "Milestones and progress bars make your wins visible. Small steps compound into big results." },
            { title: "Never go alone", desc: "Tap into the community and mentors for advice, feedback, and accountability when you need it." },
          ].map((item, i) => (
            <Card key={i} className="p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-blue-600 dark:text-blue-400">{item.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4) Who Is LifeMap For */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <SectionTitle
          eyebrow="Who benefits"
          title="Who Is LifeMap For?"
          subtitle="Students, professionals, and builders—anyone ready to grow with a clear, visual plan."
        />
        <div className="mt-12 grid gap-8 md:grid-cols-3 max-w-6xl mx-auto text-center">
          {[
            { emoji: "🎓", title: "Students", desc: "Map semesters, prep for exams, plan internships, and build a skills portfolio that stands out." },
            { emoji: "💼", title: "Professionals", desc: "Plan promotions, certifications, and skill upgrades with quarterly milestones and reviews." },
            { emoji: "🚀", title: "Entrepreneurs", desc: "Go from idea to launch with validation sprints, MVP milestones, and go-to-market checklists." },
          ].map((p, i) => (
            <Card key={i} className="p-8">
              <div className="text-5xl mb-3">{p.emoji}</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-blue-600 dark:text-blue-400">{p.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{p.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 5) About */}
      <section id="about" className="py-20 px-6 bg-gray-50 dark:bg-gray-800">
        <SectionTitle
          eyebrow="About"
          title="What is LifeMap?"
          subtitle="A visual roadmap builder with community and mentorship built-in—so you always know the next step."
        />
        <div className="mt-10 max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Built for clarity</h4>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              We turn fuzzy goals into clear, staged plans. Each milestone has context, dependencies, and deadlines that make progress tangible.
            </p>
          </Card>
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Designed for follow-through</h4>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Streaks, reminders, and community check-ins help you maintain momentum—even when life gets busy.
            </p>
          </Card>
        </div>
      </section>

      {/* 6) How It Works + Roadmap Preview */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <SectionTitle
          eyebrow="Get started fast"
          title="How It Works"
          subtitle="Define → Break down → Track → Get support. Repeat."
        />
        {/* Steps */}
        <div className="mt-10 grid gap-6 md:grid-cols-4 max-w-6xl mx-auto text-center">
          {[
            { step: "1", title: "Define Your Goal", hint: "Be specific & time-bound." },
            { step: "2", title: "Break It Down", hint: "Convert into 3–7 milestones." },
            { step: "3", title: "Track Progress", hint: "Update status weekly." },
            { step: "4", title: "Connect & Share", hint: "Ask mentors for feedback." },
          ].map((s, i) => (
            <Card key={i} className="p-6 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400">Step {s.step}</h3>
              <p className="mt-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{s.title} 🎯</p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{s.hint}</p>
            </Card>
          ))}
        </div>

        {/* Visual Roadmap Preview */}
        <div className="mt-12 max-w-4xl mx-auto">
          <Card className="p-6">
            <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Roadmap Preview</h4>
            <p className="mt-2 text-gray-600 dark:text-gray-300">A simple snapshot of how milestones line up over time.</p>

            <div className="mt-6">
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div className="absolute left-0 top-0 h-2 bg-blue-600 dark:bg-blue-400 rounded-full w-1/3" />
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Milestone 1", desc: "Research & outline", done: true },
                  { label: "Milestone 2", desc: "Build MVP features", done: false },
                  { label: "Milestone 3", desc: "User testing & feedback", done: false },
                ].map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 ${m.done ? "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"}`}
                  >
                    <div className="flex items-center gap-2">
                      {m.done ? <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <span className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-500" />}
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{m.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 7) FAQ */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-800">
        <SectionTitle
          eyebrow="Answers"
          title="Frequently Asked Questions"
          subtitle="If you can’t find what you’re looking for, ping us from the footer."
        />
        <div className="mt-8 max-w-3xl mx-auto space-y-4">
          {[
            { q: "Is LifeMap free to use?", a: "Yes. The free plan covers personal roadmaps, progress tracking, and community access. Pro adds advanced analytics, mentor slots, and templates." },
            { q: "Can I collaborate with others?", a: "Absolutely. You can invite peers to view or comment on your roadmap, and join groups to share updates and get feedback." },
            { q: "Is my data secure?", a: "We prioritize privacy and security. Your data is encrypted in transit and at rest, and you control what is shared." },
          ].map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* 8) CTA Footer */}
      <footer className="py-16 px-6 bg-blue-600 text-white text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Ready to Start Your Journey?</h2>
        <p className="mt-4 text-base sm:text-lg max-w-2xl mx-auto text-blue-50">
          Join LifeMap today and take the first step toward achieving your goals.
        </p>
        <div className="mt-8">
          <a
            href="#"
            className="px-6 py-3 rounded-xl bg-white text-blue-600 dark:text-blue-800 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition inline-block"
          >
            Sign Up Now
          </a>
        </div>
      </footer>
      {/* 8) Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand / Description */}
          <div>
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">LifeMap</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your personal career roadmap builder. Stay motivated and achieve your goals!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="hover:text-blue-600 dark:hover:text-blue-400">Home</a></li>
              <li><a href="#goals" className="hover:text-blue-600 dark:hover:text-blue-400">Goals</a></li>
              <li><a href="#roadmap" className="hover:text-blue-600 dark:hover:text-blue-400">Roadmap</a></li>
              <li><a href="#dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">Dashboard</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <p>Email: support@lifemap.com</p>
            <p>Phone: +91 98765 43210</p>
            <p className="mt-2">Follow us:</p>
            <div className="flex items-center gap-2 mt-1 text-blue-500">
              <a href="#" className="hover:opacity-80">🌐</a>
              <a href="#" className="hover:opacity-80">🐦</a>
              <a href="#" className="hover:opacity-80">📘</a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-300 dark:border-gray-700 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          © 2025 LifeMap. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
