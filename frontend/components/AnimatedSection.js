'use client';

import { motion } from 'framer-motion';

export default function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0,
  direction = "up" 
}) {
  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
    none: { x: 0, y: 0 }
  };

  const initial = { 
    opacity: 0, 
    ...directions[direction] 
  };

  return (
    <motion.div
      initial={initial}
      whileInView={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.6, 
        delay: delay,
        ease: [0.22, 1, 0.36, 1] // Quintic ease-out para mayor elegancia
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
