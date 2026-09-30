import { Injectable, computed, inject, signal } from '@angular/core';
import { Debt, DebtStatus, DebtType } from '../models/debt.model';
import { firestore } from '../config/firebase.config';
import { FinanceService } from './finance.service';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class DebtService {
  private readonly financeService = inject(FinanceService);

  // Signals de estado
  readonly debts = signal<Debt[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Modales
  readonly isModalOpen = signal<boolean>(false);
  readonly editingDebt = signal<Debt | null>(null);
  readonly isPayModalOpen = signal<boolean>(false);
  readonly payingDebt = signal<Debt | null>(null);

  // Filtros
  readonly selectedStatusFilter = signal<'all' | 'pending' | 'paid'>('all');
  readonly selectedTypeFilter = signal<'all' | 'payable' | 'receivable'>('all');
  readonly searchTerm = signal<string>('');

  constructor() {
    this.listenToDebts();
  }

  /**
   * Suscripción en tiempo real a la colección 'debts' de Cloud Firestore.
   */
  private listenToDebts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const debtsCol = collection(firestore, 'debts');
      const debtsQuery = query(debtsCol, orderBy('date', 'desc'));

      onSnapshot(
        debtsQuery,
        (snapshot) => {
          const items: Debt[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data['title'] || '',
              person: data['person'] || '',
              amount: Number(data['amount']) || 0,
              type: (data['type'] as DebtType) || 'payable',
              status: (data['status'] as DebtStatus) || 'pending',
              date: data['date'] || new Date().toISOString().substring(0, 10),
              dueDate: data['dueDate'] || '',
              paidDate: data['paidDate'] || '',
              paidFromAccount: data['paidFromAccount'] || '',
              movementId: data['movementId'] || '',
              notes: data['notes'] || ''
            };
          });

          this.debts.set(items);
          this.isLoading.set(false);
          this.errorMessage.set(null);
        },
        (error) => {
          console.error('Error al escuchar deudas en Cloud Firestore:', error);
          this.isLoading.set(false);
          if (error.code === 'permission-denied') {
            this.errorMessage.set(
              'Permisos denegados en Firebase: Asegúrate de habilitar la regla para la colección "debts" en tu Firebase Console.'
            );
          } else {
            this.errorMessage.set(`Error de conexión con Cloud Firestore: ${error.message}`);
          }
        }
      );
    } catch (err: any) {
      this.isLoading.set(false);
      this.errorMessage.set(`Error al conectar con Firestore: ${err?.message || err}`);
    }
  }

  // Métricas Computadas
  readonly totalPendingPayable = computed(() => {
    return this.debts()
      .filter((d) => d.type === 'payable' && d.status === 'pending')
      .reduce((sum, d) => sum + d.amount, 0);
  });

  readonly totalPendingReceivable = computed(() => {
    return this.debts()
      .filter((d) => d.type === 'receivable' && d.status === 'pending')
      .reduce((sum, d) => sum + d.amount, 0);
  });

  readonly totalPaid = computed(() => {
    return this.debts()
      .filter((d) => d.status === 'paid')
      .reduce((sum, d) => sum + d.amount, 0);
  });

  readonly pendingCount = computed(() => {
    return this.debts().filter((d) => d.status === 'pending').length;
  });

  readonly pendingPayableCount = computed(() => {
    return this.debts().filter((d) => d.type === 'payable' && d.status === 'pending').length;
  });

  // Lista Filtrada para la UI
  readonly filteredDebts = computed(() => {
    const status = this.selectedStatusFilter();
    const type = this.selectedTypeFilter();
    const search = this.searchTerm().trim().toLowerCase();

    return this.debts().filter((d) => {
      const matchesStatus = status === 'all' || d.status === status;
      const matchesType = type === 'all' || d.type === type;
      const matchesSearch =
        search === '' ||
        d.title.toLowerCase().includes(search) ||
        d.person.toLowerCase().includes(search) ||
        (d.notes && d.notes.toLowerCase().includes(search));

      return matchesStatus && matchesType && matchesSearch;
    });
  });

  // Métodos de Modal
  openModal(): void {
    this.editingDebt.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(debt: Debt): void {
    this.editingDebt.set(debt);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingDebt.set(null);
  }

  openPayModal(debt: Debt): void {
    this.payingDebt.set(debt);
    this.isPayModalOpen.set(true);
  }

  closePayModal(): void {
    this.isPayModalOpen.set(false);
    this.payingDebt.set(null);
  }

  // Operaciones CRUD
  async addDebt(newDebt: Omit<Debt, 'id'>): Promise<void> {
    try {
      const debtsCol = collection(firestore, 'debts');
      await addDoc(debtsCol, {
        title: newDebt.title,
        person: newDebt.person,
        amount: Number(newDebt.amount),
        type: newDebt.type,
        status: newDebt.status || 'pending',
        date: newDebt.date,
        dueDate: newDebt.dueDate || '',
        notes: newDebt.notes || '',
        createdAt: serverTimestamp()
      });
      this.closeModal();
    } catch (error: any) {
      console.error('Error al guardar deuda en Firestore:', error);
      alert(`Error al guardar deuda en Cloud Firestore: ${error.message}`);
      throw error;
    }
  }

  async updateDebt(id: string, updatedDebt: Partial<Debt>): Promise<void> {
    try {
      const docRef = doc(firestore, 'debts', id);
      await updateDoc(docRef, {
        title: updatedDebt.title,
        person: updatedDebt.person,
        amount: Number(updatedDebt.amount),
        type: updatedDebt.type,
        status: updatedDebt.status,
        date: updatedDebt.date,
        dueDate: updatedDebt.dueDate || '',
        notes: updatedDebt.notes || '',
        updatedAt: serverTimestamp()
      });
      this.closeModal();
    } catch (error: any) {
      console.error('Error al actualizar deuda en Firestore:', error);
      alert(`Error al actualizar deuda en Cloud Firestore: ${error.message}`);
      throw error;
    }
  }

  async deleteDebt(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'debts', id);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('Error al eliminar deuda en Firestore:', error);
      alert(`Error al eliminar deuda en Cloud Firestore: ${error.message}`);
      throw error;
    }
  }

  /**
   * Liquida una deuda y registra automáticamente el Egreso/Ingreso correspondiente en Firestore.
   */
  async payDebt(debtId: string, accountId: string, paymentDate: string): Promise<void> {
    const debt = this.debts().find((d) => d.id === debtId);
    if (!debt) return;

    try {
      // 1. Registra el movimiento contable automático en FinanceService
      if (debt.type === 'payable') {
        // Yo debía dinero: al pagar, es un Egreso de la cuenta elegida
        await this.financeService.addMovement({
          title: `Pago de deuda a ${debt.person}: ${debt.title}`,
          amount: debt.amount,
          type: 'expense',
          category: 'deudas',
          account: accountId,
          date: paymentDate
        });
      } else {
        // Me debían dinero: al cobrar, es un Ingreso a la cuenta elegida
        await this.financeService.addMovement({
          title: `Cobro de deuda de ${debt.person}: ${debt.title}`,
          amount: debt.amount,
          type: 'income',
          category: 'otros',
          account: accountId,
          date: paymentDate
        });
      }

      // 2. Marca la deuda como pagada en Firestore
      const docRef = doc(firestore, 'debts', debtId);
      await updateDoc(docRef, {
        status: 'paid',
        paidDate: paymentDate,
        paidFromAccount: accountId,
        updatedAt: serverTimestamp()
      });

      this.closePayModal();
    } catch (error: any) {
      console.error('Error al liquidar la deuda:', error);
      alert(`Error al liquidar la deuda: ${error.message}`);
      throw error;
    }
  }

  setStatusFilter(status: 'all' | 'pending' | 'paid'): void {
    this.selectedStatusFilter.set(status);
  }

  setTypeFilter(type: 'all' | 'payable' | 'receivable'): void {
    this.selectedTypeFilter.set(type);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }
}
