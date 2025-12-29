import React from "react";
import { motion } from "framer-motion";

export default function HeroAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer rings */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[500px] h-[500px] border-2 border-blue-400/30 rounded-full"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute w-96 h-96 border-2 border-purple-400/30 rounded-full"
      />

      {/* Middle ring with gradient */}
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute w-72 h-72 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, rgba(59, 130, 246, 0.3), rgba(168, 85, 247, 0.3), rgba(59, 130, 246, 0.3))",
        }}
      />

      {/* Inner glow ring */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-48 h-48 bg-blue-500/20 rounded-full blur-xl"
      />

      {/* Center pulsating circle */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 w-36 h-36 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center"
      >
        {/* Inner white circle */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1,
          }}
          className="w-24 h-24 bg-white rounded-full flex items-center justify-center"
        >
          {/* Innermost blue dot */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-12 h-12 bg-blue-500 rounded-full"
          />
        </motion.div>
      </motion.div>

      {/* Outer glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
    </div>
  );
}