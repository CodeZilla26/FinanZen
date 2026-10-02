import { Injectable, computed, signal } from '@angular/core';
import { Movement, MovementType, CATEGORIES, ACCOUNTS, AccountInfo } from '../models/movement.model';
import { firestore } from '../config/firebase.config';
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

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  total: number;
  percentage: number;
}

export interface AccountSummaryItem {
  id: string;
  name: string;
  type: 'efectivo' | 'banco' | 'billetera' | 'transporte';
  balance: number;
  income: number;
  expense: number;
  badgeBg: string;
  badgeText: string;
}

export interface ModalPreset {
  type?: MovementType;
  account?: string;
  toAccount?: string;
  title?: string;
  amount?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  // State Signals (100% data real desde Cloud Firestore, sin mock data)
  readonly movements = signal<Movement[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedTypeFilter = signal<'all' | 'income' | 'expense' | 'transfer'>('all');
  readonly selectedCategoryFilter = signal<string>('all');
  readonly selectedAccountFilter = signal<string>('all');
  readonly selectedStartDate = signal<string>('');
  readonly selectedEndDate = signal<string>('');
  readonly searchTerm = signal<string>('');
  readonly isModalOpen = signal<boolean>(false);
  readonly editingMovement = signal<Movement | null>(null);
  readonly initialModalPreset = signal<ModalPreset | null>(null);

  constructor() {
    this.listenToMovements();
  }

  /**
   * Suscripción en tiempo real a la colección 'movements' de Cloud Firestore.
   */
  private listenToMovements(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const movementsCol = collection(firestore, 'movements');
      const movementsQuery = query(movementsCol, orderBy('date', 'desc'));

      onSnapshot(
        movementsQuery,
        (snapshot) => {
          const items: Movement[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data['title'] || '',
              amount: Number(data['amount']) || 0,
              type: data['type'] as MovementType,
              category: data['category'] || 'otros',
              account: data['account'] || 'efectivo',
              toAccount: data['toAccount'] || '',
              date: data['date'] || new Date().toISOString().substring(0, 10)
            };
          });

          this.movements.set(items);
          this.isLoading.set(false);
          this.errorMessage.set(null);
        },
        (error) => {
          console.error('Error al escuchar Cloud Firestore:', error);
          this.isLoading.set(false);

          if (error.code === 'permission-denied') {
            this.errorMessage.set(
              'Permisos denegados en Firebase: Tus reglas de seguridad actuales tienen "allow read, write: if false;". Debes actualizarlas en la consola de Firebase a "allow read, write: if true;" para permitir el acceso.'
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

  // Computed Financial Metrics
  readonly totalIncome = computed(() => {
    return this.movements()
      .filter((m) => m.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
  });

  readonly totalExpense = computed(() => {
    return this.movements()
      .filter((m) => m.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  });

  readonly totalBalance = computed(() => {
    return this.totalIncome() - this.totalExpense();
  });

  readonly savingsRate = computed(() => {
    const income = this.totalIncome();
    if (income === 0) return 0;
    const balance = this.totalBalance();
    if (balance <= 0) return 0;
    return Math.round((balance / income) * 100);
  });

  /**
   * Retorna la fecha local actual en formato ISO 'YYYY-MM-DD'.
   */
  getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Métricas del día actual
  readonly todayExpense = computed(() => {
    const today = this.getTodayDateString();
    return this.movements()
      .filter((m) => m.type === 'expense' && m.date === today)
      .reduce((sum, m) => sum + m.amount, 0);
  });

  readonly todayIncome = computed(() => {
    const today = this.getTodayDateString();
    return this.movements()
      .filter((m) => m.type === 'income' && m.date === today)
      .reduce((sum, m) => sum + m.amount, 0);
  });

  // Resumen de saldos por cuenta / método de pago
  readonly accountsSummary = computed<AccountSummaryItem[]>(() => {
    const stats: Record<string, { income: number; expense: number; balance: number }> = {};

    for (const accId of Object.keys(ACCOUNTS)) {
      stats[accId] = { income: 0, expense: 0, balance: 0 };
    }

    for (const m of this.movements()) {
      const accId = m.account || 'efectivo';
      if (!stats[accId]) {
        stats[accId] = { income: 0, expense: 0, balance: 0 };
      }
      if (m.type === 'income') {
        const accId = m.account || 'efectivo';
        if (!stats[accId]) stats[accId] = { income: 0, expense: 0, balance: 0 };
        stats[accId].income += m.amount;
        stats[accId].balance += m.amount;
      } else if (m.type === 'expense') {
        const accId = m.account || 'efectivo';
        if (!stats[accId]) stats[accId] = { income: 0, expense: 0, balance: 0 };
        stats[accId].expense += m.amount;
        stats[accId].balance -= m.amount;
      } else if (m.type === 'transfer') {
        const fromAcc = m.account || 'efectivo';
        const toAcc = m.toAccount || 'efectivo';
        if (!stats[fromAcc]) stats[fromAcc] = { income: 0, expense: 0, balance: 0 };
        if (!stats[toAcc]) stats[toAcc] = { income: 0, expense: 0, balance: 0 };
        stats[fromAcc].balance -= m.amount;
        stats[toAcc].balance += m.amount;
      }
    }

    return Object.entries(stats).map(([id, data]) => {
      const info = ACCOUNTS[id] || ACCOUNTS['otra'];
      return {
        id,
        name: info.name,
        type: info.type,
        balance: data.balance,
        income: data.income,
        expense: data.expense,
        badgeBg: info.badgeBg,
        badgeText: info.badgeText
      };
    });
  });

  // Filtered Movements for Table / List
  readonly filteredMovements = computed(() => {
    const typeFilter = this.selectedTypeFilter();
    const categoryFilter = this.selectedCategoryFilter();
    const accountFilter = this.selectedAccountFilter();
    const search = this.searchTerm().trim().toLowerCase();
    const startDate = this.selectedStartDate();
    const endDate = this.selectedEndDate();

    return this.movements().filter((m) => {
      const matchesType = typeFilter === 'all' || m.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
      const matchesAccount =
        accountFilter === 'all' ||
        (m.account || 'efectivo') === accountFilter ||
        (m.type === 'transfer' && m.toAccount === accountFilter);
      const matchesSearch =
        search === '' ||
        m.title.toLowerCase().includes(search) ||
        (CATEGORIES[m.category] && CATEGORIES[m.category].name.toLowerCase().includes(search)) ||
        (ACCOUNTS[m.account] && ACCOUNTS[m.account].name.toLowerCase().includes(search)) ||
        (m.toAccount && ACCOUNTS[m.toAccount] && ACCOUNTS[m.toAccount].name.toLowerCase().includes(search));
      const matchesDate =
        (!startDate || m.date >= startDate) &&
        (!endDate || m.date <= endDate);

      return matchesType && matchesCategory && matchesAccount && matchesSearch && matchesDate;
    });
  });

  // Category breakdown for expenses
  readonly categoryExpenses = computed<CategoryBreakdownItem[]>(() => {
    const totalExp = this.totalExpense();
    if (totalExp === 0) return [];

    const map: Record<string, number> = {};
    for (const mov of this.movements()) {
      if (mov.type === 'expense') {
        map[mov.category] = (map[mov.category] || 0) + mov.amount;
      }
    }

    return Object.entries(map)
      .map(([catId, amount]) => {
        const catInfo = CATEGORIES[catId] || CATEGORIES['otros'];
        return {
          categoryId: catId,
          name: catInfo.name,
          color: catInfo.color,
          total: amount,
          percentage: Math.round((amount / totalExp) * 100)
        };
      })
      .sort((a, b) => b.total - a.total);
  });

  // Actions
  openModal(preset?: ModalPreset): void {
    this.editingMovement.set(null);
    this.initialModalPreset.set(preset || null);
    this.isModalOpen.set(true);
  }

  openTransferModal(
    fromAccount: string = 'efectivo',
    toAccount: string = 'tarjeta_tren',
    defaultTitle: string = 'Recarga Tarjeta del Tren'
  ): void {
    this.editingMovement.set(null);
    this.initialModalPreset.set({
      type: 'transfer',
      account: fromAccount,
      toAccount: toAccount,
      title: defaultTitle
    });
    this.isModalOpen.set(true);
  }

  openEditModal(movement: Movement): void {
    this.initialModalPreset.set(null);
    this.editingMovement.set(movement);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingMovement.set(null);
    this.initialModalPreset.set(null);
  }

  async addMovement(newMovement: Omit<Movement, 'id'>): Promise<void> {
    try {
      const movementsCol = collection(firestore, 'movements');
      await addDoc(movementsCol, {
        title: newMovement.title,
        amount: Number(newMovement.amount),
        type: newMovement.type,
        category: newMovement.category,
        account: newMovement.account || 'efectivo',
        toAccount: newMovement.toAccount || '',
        date: newMovement.date,
        createdAt: serverTimestamp()
      });
      this.closeModal();
    } catch (error: any) {
      console.error('Error al guardar movimiento en Firestore:', error);
      if (error.code === 'permission-denied') {
        alert(
          '⚠️ Error de permisos en Firebase: Tus reglas actuales bloquean la escritura ("allow write: if false;"). Debes cambiarlas a "allow read, write: if true;" en la pestaña Rules de tu Firebase Console.'
        );
      } else {
        alert(`Error al guardar en Cloud Firestore: ${error.message}`);
      }
      throw error;
    }
  }

  async updateMovement(id: string, updatedMovement: Omit<Movement, 'id'>): Promise<void> {
    try {
      const docRef = doc(firestore, 'movements', id);
      await updateDoc(docRef, {
        title: updatedMovement.title,
        amount: Number(updatedMovement.amount),
        type: updatedMovement.type,
        category: updatedMovement.category,
        account: updatedMovement.account || 'efectivo',
        toAccount: updatedMovement.toAccount || '',
        date: updatedMovement.date,
        updatedAt: serverTimestamp()
      });
      this.closeModal();
    } catch (error: any) {
      console.error('Error al actualizar movimiento en Firestore:', error);
      if (error.code === 'permission-denied') {
        alert(
          '⚠️ Error de permisos en Firebase: Tus reglas actuales bloquean la actualización ("allow write: if false;").'
        );
      } else {
        alert(`Error al actualizar en Cloud Firestore: ${error.message}`);
      }
      throw error;
    }
  }

  async deleteMovement(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'movements', id);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('Error al eliminar movimiento en Firestore:', error);
      if (error.code === 'permission-denied') {
        alert(
          '⚠️ Error de permisos en Firebase: Tus reglas bloquean la eliminación ("allow write: if false;").'
        );
      } else {
        alert(`Error al eliminar en Firestore: ${error.message}`);
      }
      throw error;
    }
  }

  setTypeFilter(type: 'all' | 'income' | 'expense' | 'transfer'): void {
    this.selectedTypeFilter.set(type);
  }

  setCategoryFilter(category: string): void {
    this.selectedCategoryFilter.set(category);
  }

  setAccountFilter(account: string): void {
    this.selectedAccountFilter.set(account);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  setDateRangeFilter(start: string, end: string): void {
    this.selectedStartDate.set(start);
    this.selectedEndDate.set(end);
  }

  clearDateFilter(): void {
    this.selectedStartDate.set('');
    this.selectedEndDate.set('');
  }
}
