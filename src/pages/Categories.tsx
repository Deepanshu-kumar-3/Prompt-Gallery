import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../types';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function Categories() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg selection:bg-brand-purple/30">
      <Header />
      
      <main className="pt-32 pb-20 px-4 max-w-7xl mx-auto min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
            Explore <span className="text-gradient">Categories</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Discover thousands of AI prompts across various styles and themes.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {CATEGORIES.map((category, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              key={category}
              onClick={() => navigate(`/?category=${encodeURIComponent(category)}`)}
              className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-brand-purple/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-brand-secondary/50 group-hover:bg-brand-purple/10 transition-colors z-10" />
              
              <div className="absolute inset-0 p-6 flex flex-col justify-end z-20">
                <h3 className="text-xl font-bold text-white group-hover:text-brand-purple transition-colors drop-shadow-md">
                  {category}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
