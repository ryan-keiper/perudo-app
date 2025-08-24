export const diceAnimations = {
  roll: {
    initial: { rotate: 0, scale: 0.8, opacity: 0 },
    animate: { 
      rotate: [0, 360, 720, 1080], 
      scale: [0.8, 1.1, 0.95, 1],
      opacity: 1 
    },
    transition: {
      duration: 1.2,
      ease: "easeOut",
      times: [0, 0.6, 0.8, 1]
    }
  },
  
  reveal: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.1
    }
  },
  
  bounce: {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0]
    },
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  },

  // Enhanced pirate-themed rolling animation
  pirateRoll: {
    animate: {
      x: [0, -3, 4, -2, 5, -4, 2, -1, 3, -2, 1, 0],
      y: [0, -2, 1, -4, 2, -3, 1, -5, 3, -2, 1, 0],
      rotate: [0, -8, 12, -6, 15, -10, 8, -4, 10, -6, 3, 0],
      scale: [1, 1.02, 0.98, 1.04, 0.96, 1.03, 0.99, 1.02, 0.98, 1.01, 0.99, 1]
    },
    transition: {
      duration: 1.8,
      ease: "easeInOut",
      times: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 1]
    }
  },

  // Landing animation after roll
  treasureLanding: {
    animate: {
      scale: [1.2, 0.9, 1.1, 0.95, 1.02, 1],
      rotate: [15, -8, 4, -2, 1, 0],
      filter: [
        'brightness(1)',
        'brightness(1.3) saturate(1.2)',
        'brightness(1.1)',
        'brightness(1)'
      ]
    },
    transition: {
      duration: 0.6,
      ease: "easeOut",
      times: [0, 0.2, 0.4, 0.6, 0.8, 1]
    }
  },

  // Glow effect during roll
  mysticGlow: {
    animate: {
      boxShadow: [
        '0 0 0px rgba(245, 158, 11, 0)',
        '0 0 25px rgba(245, 158, 11, 0.6)',
        '0 0 15px rgba(245, 158, 11, 0.4)',
        '0 0 10px rgba(245, 158, 11, 0.2)'
      ]
    },
    transition: {
      duration: 1.8,
      ease: "easeInOut"
    }
  }
};

export const playerAnimations = {
  turnStart: {
    animate: {
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 0 0 0 rgba(245, 158, 11, 0)",
        "0 0 20px 10px rgba(245, 158, 11, 0.2)",
        "0 0 10px 5px rgba(245, 158, 11, 0.1)"
      ]
    },
    transition: {
      duration: 0.8,
      ease: "easeInOut"
    }
  },
  
  elimination: {
    initial: { opacity: 1, scale: 1 },
    animate: { 
      opacity: 0.5, 
      scale: 0.95,
      filter: "grayscale(100%)"
    },
    transition: {
      duration: 1,
      ease: "easeOut"
    }
  },
  
  calzaSuccess: {
    animate: {
      scale: [1, 1.05, 1],
      backgroundColor: [
        "rgba(5, 150, 105, 0)",
        "rgba(5, 150, 105, 0.1)",
        "rgba(5, 150, 105, 0)"
      ]
    },
    transition: {
      duration: 1,
      ease: "easeInOut"
    }
  }
};

export const boardAnimations = {
  compassSweep: {
    animate: {
      rotate: [0, 360],
      opacity: [0, 1, 1, 0]
    },
    transition: {
      duration: 1.5,
      ease: "easeInOut",
      times: [0, 0.2, 0.8, 1]
    }
  },
  
  waveEffect: {
    animate: {
      x: [0, 5, -5, 0],
      y: [0, -2, 2, 0]
    },
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse"
    }
  }
};

export const particleEffects = {
  goldBurst: {
    particles: 20,
    spread: 50,
    initialVelocity: 10,
    gravity: 0.3,
    fadeOut: 2,
    colors: ["#F59E0B", "#FBBf24", "#D97706"]
  },
  
  seaSpray: {
    particles: 15,
    spread: 30,
    initialVelocity: 5,
    gravity: 0.5,
    fadeOut: 1.5,
    colors: ["#06B6D4", "#22D3EE", "#0891B2"]
  },
  
  treasureSparkle: {
    particles: 10,
    spread: 20,
    initialVelocity: 3,
    gravity: 0.1,
    fadeOut: 1,
    colors: ["#F59E0B", "#FFFFFF", "#FBBf24"]
  }
};