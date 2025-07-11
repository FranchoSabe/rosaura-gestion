/**
 * 🎨 DESIGN TOKENS - ROSAURA RESERVAS
 * Sistema de diseño unificado para admin y cliente
 * Inspirado en sistemas como Tailwind, pero personalizado para el branding
 */

// 🎯 COLORES PRINCIPALES
export const colors = {
  // Brand colors - Verde Rosaura
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7', 
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80', // Verde principal
    500: '#22c55e', // Verde Rosaura
    600: '#16a34a', // Verde admin header
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },
  
  // Grises para interfaces
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },
  
  // Estados y feedback
  success: {
    light: '#dcfce7',
    DEFAULT: '#22c55e',
    dark: '#15803d'
  },
  warning: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b', 
    dark: '#d97706'
  },
  error: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    dark: '#dc2626'
  },
  info: {
    light: '#dbeafe',
    DEFAULT: '#3b82f6',
    dark: '#1d4ed8'
  },
  
  // Fondos con transparencia
  backdrop: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
    darker: 'rgba(0, 0, 0, 0.9)'
  },
  
  // Glassmorphism
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(255, 255, 255, 0.05)'
  }
};

// 🔤 TIPOGRAFÍA
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    display: ['Daniel', 'Inter', 'sans-serif'], // Para títulos principales
    mono: ['Fira Code', 'monospace']
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px  
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '4rem'     // 64px
  },
  
  fontWeight: {
    light: '300',
    normal: '400', 
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
};

// 📏 ESPACIADO
export const spacing = {
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem'       // 96px
};

// 🔄 ANIMACIONES
export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms', 
    slow: '350ms',
    slower: '500ms'
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.16, 1, 0.3, 1)' // Más suave y profesional
  }
};

// 🎭 EFECTOS
export const effects = {
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    full: '9999px'
  },
  
  boxShadow: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    
    // Shadows específicos para glassmorphism
    glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    glassHover: '0 12px 40px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
  },
  
  backdropBlur: {
    sm: 'blur(4px)',
    base: 'blur(8px)', 
    md: 'blur(12px)',
    lg: 'blur(16px)',
    xl: 'blur(24px)'
  }
};

// 📱 BREAKPOINTS
export const breakpoints = {
  xs: '475px',
  sm: '640px', 
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// 🎯 COMPONENTES ESPECÍFICOS
export const components = {
  button: {
    height: {
      sm: '2.25rem',   // 36px
      base: '2.75rem', // 44px  
      lg: '3.5rem'     // 56px
    },
    padding: {
      sm: '0.5rem 1rem',
      base: '0.75rem 1.5rem', 
      lg: '1rem 2rem'
    }
  },
  
  input: {
    height: {
      sm: '2.25rem',
      base: '2.75rem',
      lg: '3rem'
    }
  },
  
  modal: {
    backdrop: colors.backdrop.medium,
    maxWidth: '28rem' // 448px
  },
  
  card: {
    background: colors.backdrop.light,
    border: colors.glass.light,
    borderRadius: effects.borderRadius.xl,
    shadow: effects.boxShadow.glass
  }
};

// 🎨 UTILIDADES CSS CUSTOM PROPERTIES
export const cssVariables = {
  '--color-primary': colors.primary[500],
  '--color-primary-hover': colors.primary[600],
  '--color-success': colors.success.DEFAULT,
  '--color-warning': colors.warning.DEFAULT,
  '--color-error': colors.error.DEFAULT,
  
  '--font-sans': typography.fontFamily.sans.join(', '),
  '--font-display': typography.fontFamily.display.join(', '),
  
  '--shadow-glass': effects.boxShadow.glass,
  '--shadow-glass-hover': effects.boxShadow.glassHover,
  
  '--backdrop-blur': effects.backdropBlur.md,
  '--border-radius': effects.borderRadius.lg,
  
  '--transition-fast': `all ${animation.duration.fast} ${animation.easing.bounce}`,
  '--transition-normal': `all ${animation.duration.normal} ${animation.easing.bounce}`
};

// 📋 EXPORT DEFAULT CONSOLIDADO
export default {
  colors,
  typography, 
  spacing,
  animation,
  effects,
  breakpoints,
  components,
  cssVariables
}; 