export const colors = {
  primary: {
    main: '#0ea5e9', // Sky blue
    light: '#38bdf8',
    dark: '#0284c7',
    bg: 'from-sky-500 to-indigo-600'
  },
  emergency: {
    main: '#dc2626', // Red
    light: '#ef4444',
    dark: '#b91c1c',
    bg: 'from-red-500 to-rose-600'
  },
  success: {
    main: '#10b981', // Emerald
    light: '#34d399',
    dark: '#059669',
    bg: 'from-emerald-500 to-teal-600'
  },
  warning: {
    main: '#f59e0b', // Amber
    light: '#fbbf24',
    dark: '#d97706',
    bg: 'from-amber-400 to-orange-500'
  },
  purple: {
    main: '#8b5cf6',
    light: '#a78bfa',
    dark: '#7c3aed',
    bg: 'from-violet-500 to-purple-600'
  },
  neutral: {
    bg: 'from-slate-50 to-slate-100',
    card: 'bg-white/80 backdrop-blur-xl',
    border: 'border-slate-200/60',
    text: 'text-slate-900',
    textMuted: 'text-slate-500'
  }
};

export const animations = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  },
  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 }
  },
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity }
    }
  }
};
