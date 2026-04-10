import React from 'react';
import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export const SplashScreen: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30 mb-6 relative">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Leaf size={48} fill="currentColor" />
          </motion.div>
          <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] animate-ping opacity-20" />
        </div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            GREEN <span className="text-primary">NRG</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">
            {t('splash.tagline')}
          </p>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-4">
        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-full h-full bg-primary"
          />
        </div>
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
          {t('splash.loading')}
        </p>
      </div>
    </div>
  );
};
