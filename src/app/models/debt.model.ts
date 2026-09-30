export type DebtType = 'payable' | 'receivable'; // 'payable': Yo debo (Por pagar) | 'receivable': Me deben (Por cobrar)
export type DebtStatus = 'pending' | 'paid';

export interface Debt {
  id: string;
  title: string;            // Concepto / Motivo de la deuda
  person: string;           // Persona o entidad (Acreedor o Deudor)
  amount: number;           // Monto total adeudado
  type: DebtType;           // 'payable' (Por pagar) o 'receivable' (Por cobrar)
  status: DebtStatus;       // 'pending' o 'paid'
  date: string;             // Fecha de creación / acuerdo (YYYY-MM-DD)
  dueDate?: string;         // Fecha límite o compromiso de pago (YYYY-MM-DD)
  paidDate?: string;        // Fecha en que se liquidó
  paidFromAccount?: string; // Cuenta con la que se pagó (efectivo, bcp, bbva, etc.)
  movementId?: string;      // ID del movimiento generado en Firestore
  notes?: string;           // Detalle o nota opcional
}
