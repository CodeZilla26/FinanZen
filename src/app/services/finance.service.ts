import { Injectable, computed, signal } from '@angular/core';
import { Movement, MovementType, CATEGORIES } from '../models/movement.model';
import { firestore } from '../config/firebase.config';
import {
  collection,
  onSnapshot,
  addDoc,
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

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  // State Signals (100% data real desde Cloud Firestore, sin mock data)
  readonly movements = signal<Movement[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedTypeFilter = signal<'all' | 'income' | 'expense'>('all');
  readonly selectedCategoryFilter = signal<string>('all');
  readonly searchTerm = signal<string>('');
  readonly isModalOpen = signal<boolean>(false);

  constructor() {
    this.listenToMovements();
  }

  /**
   * Suscripción en tiempo real a la colección 'movements' de Cloud Firestore.
   * Cualquier cambio en la base de datos se refleja de inmediato en los Signals.
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

  // Filtered Movements for Table / List
  readonly filteredMovements = computed(() => {
    const typeFilter = this.selectedTypeFilter();
    const categoryFilter = this.selectedCategoryFilter();
    const search = this.searchTerm().trim().toLowerCase();

    return this.movements().filter((m) => {
      const matchesType = typeFilter === 'all' || m.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
      const matchesSearch =
        search === '' ||
        m.title.toLowerCase().includes(search) ||
        (CATEGORIES[m.category] && CATEGORIES[m.category].name.toLowerCase().includes(search));

      return matchesType && matchesCategory && matchesSearch;
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
  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  async addMovement(newMovement: Omit<Movement, 'id'>): Promise<void> {
    try {
      const movementsCol = collection(firestore, 'movements');
      await addDoc(movementsCol, {
        title: newMovement.title,
        amount: Number(newMovement.amount),
        type: newMovement.type,
        category: newMovement.category,
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

  setTypeFilter(type: 'all' | 'income' | 'expense'): void {
    this.selectedTypeFilter.set(type);
  }

  setCategoryFilter(category: string): void {
    this.selectedCategoryFilter.set(category);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }
}
