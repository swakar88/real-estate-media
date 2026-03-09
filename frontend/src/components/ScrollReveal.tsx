"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export const ScrollReveal = ({ children, delay = 0, className = "", direction = "up" }: Props) => {
  const directionOffset = 
    direction === "up" ? { y: 30, x: 0 } :
    direction === "down" ? { y: -30, x: 0 } :
    direction === "left" ? { x: 30, y: 0 } :
    direction === "right" ? { x: -30, y: 0 } : 
    { x: 0, y: 0 };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionOffset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerContainer = ({ children, className = "", delay = 0 }: Props) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.2,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className = "", direction = "up" }: Props) => {
  const directionOffset = 
    direction === "up" ? { y: 30, x: 0 } :
    direction === "down" ? { y: -30, x: 0 } :
    direction === "left" ? { x: 30, y: 0 } :
    direction === "right" ? { x: -30, y: 0 } : 
    { x: 0, y: 0 };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, ...directionOffset },
        show: { 
            opacity: 1, 
            x: 0, 
            y: 0, 
            transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] } 
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
