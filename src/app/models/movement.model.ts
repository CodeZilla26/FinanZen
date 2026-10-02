export type MovementType = 'income' | 'expense' | 'transfer';

export interface Movement {
  id: string;
  title: string;
  amount: number;
  type: MovementType;
  category: string;
  account: string; // Cuenta origen: 'efectivo', 'bcp', 'bbva', 'interbank', 'yape_plin', 'otra'
  toAccount?: string; // Cuenta destino (requerida cuando type === 'transfer')
  date: string; // YYYY-MM-DD
}

export interface AccountInfo {
  id: string;
  name: string;
  type: 'efectivo' | 'banco' | 'billetera' | 'tarjeta';
  icon: string;
  badgeBg: string;
  badgeText: string;
}

export const ACCOUNTS: Record<string, AccountInfo> = {
  efectivo: {
    id: 'efectivo',
    name: 'Efectivo',
    type: 'efectivo',
    icon: 'cash',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    badgeText: 'text-emerald-800 dark:text-emerald-300'
  },
  tarjeta_tren: {
    id: 'tarjeta_tren',
    name: 'Tarjeta del Tren',
    type: 'tarjeta',
    icon: 'train',
    badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    badgeText: 'text-cyan-800 dark:text-cyan-300'
  },
  bcp: {
    id: 'bcp',
    name: 'Cuenta BCP',
    type: 'banco',
    icon: 'bank',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    badgeText: 'text-blue-800 dark:text-blue-300'
  },
  bbva: {
    id: 'bbva',
    name: 'Cuenta BBVA',
    type: 'banco',
    icon: 'bank',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    badgeText: 'text-sky-800 dark:text-sky-300'
  },
  interbank: {
    id: 'interbank',
    name: 'Cuenta Interbank',
    type: 'banco',
    icon: 'bank',
    badgeBg: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    badgeText: 'text-green-800 dark:text-green-300'
  },
  yape_plin: {
    id: 'yape_plin',
    name: 'Yape / Plin',
    type: 'billetera',
    icon: 'smartphone',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    badgeText: 'text-purple-800 dark:text-purple-300'
  },
  otra: {
    id: 'otra',
    name: 'Otra Cuenta',
    type: 'banco',
    icon: 'credit-card',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    badgeText: 'text-slate-800 dark:text-slate-300'
  }
};

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  salario: {
    id: 'salario',
    name: 'Salario / Nómina',
    icon: 'briefcase',
    color: '#10b981',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    badgeText: 'text-emerald-700'
  },
  freelance: {
    id: 'freelance',
    name: 'Freelance & Proyectos',
    icon: 'laptop',
    color: '#3b82f6',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    badgeText: 'text-blue-700'
  },
  inversiones: {
    id: 'inversiones',
    name: 'Inversiones / Rendimientos',
    icon: 'trending-up',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    badgeText: 'text-purple-700'
  },
  alimentacion: {
    id: 'alimentacion',
    name: 'Alimentación & Supermercado',
    icon: 'shopping-cart',
    color: '#f59e0b',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    badgeText: 'text-amber-700'
  },
  vivienda: {
    id: 'vivienda',
    name: 'Vivienda & Servicios',
    icon: 'home',
    color: '#ef4444',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    badgeText: 'text-rose-700'
  },
  transporte: {
    id: 'transporte',
    name: 'Transporte & Combustible',
    icon: 'car',
    color: '#06b6d4',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    badgeText: 'text-cyan-700'
  },
  ocio: {
    id: 'ocio',
    name: 'Ocio & Entretenimiento',
    icon: 'film',
    color: '#ec4899',
    badgeBg: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800',
    badgeText: 'text-pink-700'
  },
  salud: {
    id: 'salud',
    name: 'Salud & Bienestar',
    icon: 'heart',
    color: '#14b8a6',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    badgeText: 'text-teal-700'
  },
  educacion: {
    id: 'educacion',
    name: 'Educación & Cursos',
    icon: 'book',
    color: '#6366f1',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    badgeText: 'text-indigo-700'
  },
  deudas: {
    id: 'deudas',
    name: 'Pago de Deudas & Préstamos',
    icon: 'credit-card',
    color: '#ea580c',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    badgeText: 'text-orange-700'
  },
  transferencia: {
    id: 'transferencia',
    name: 'Transferencia entre Cuentas',
    icon: 'repeat',
    color: '#0284c7',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    badgeText: 'text-sky-700'
  },
  otros: {
    id: 'otros',
    name: 'Otros Movimientos',
    icon: 'tag',
    color: '#64748b',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    badgeText: 'text-slate-700'
  }
};
