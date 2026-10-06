import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { Movement, CATEGORIES, CategoryInfo, ACCOUNTS, AccountInfo } from '../../models/movement.model';

export interface MovementGroup {
  dateLabel: string;
  rawDate: string;
  totalDayExpense: number;
  totalDayIncome: number;
  items: Movement[];
}

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './movement-list.html',
  host: { class: 'block h-full min-h-0' }
})
export class MovementListComponent {
  protected readonly financeService = inject(FinanceService);

  readonly categories = Object.values(CATEGORIES);
  readonly accounts = Object.values(ACCOUNTS);

  searchQuery = '';
  selectedCategory = 'all';
  selectedAccount = 'all';

  // Date Filter State
  startDate = '';
  endDate = '';
  datePreset: 'all' | 'today' | 'this_month' | 'custom' = 'all';

  get todayExpense(): number {
    return this.financeService.todayExpense();
  }

  get filteredMovements(): Movement[] {
    return this.financeService.filteredMovements();
  }

  get currentTypeFilter(): 'all' | 'income' | 'expense' | 'transfer' {
    return this.financeService.selectedTypeFilter();
  }

  get totalCount(): number {
    return this.financeService.movements().length;
  }

  get incomeCount(): number {
    return this.financeService.movements().filter((m) => m.type === 'income').length;
  }

  get expenseCount(): number {
    return this.financeService.movements().filter((m) => m.type === 'expense').length;
  }

  get transferCount(): number {
    return this.financeService.movements().filter((m) => m.type === 'transfer').length;
  }

  get isLoading(): boolean {
    return this.financeService.isLoading();
  }

  get errorMessage(): string | null {
    return this.financeService.errorMessage();
  }

  get hasActiveFilters(): boolean {
    return (
      this.currentTypeFilter !== 'all' ||
      this.selectedCategory !== 'all' ||
      this.selectedAccount !== 'all' ||
      this.searchQuery.trim() !== '' ||
      this.datePreset !== 'all'
    );
  }

  /**
   * Agrupa los movimientos cronológicamente por día para el Feed Personal (Timeline).
   */
  get groupedMovements(): MovementGroup[] {
    const list = this.filteredMovements;
    if (!list || list.length === 0) return [];

    const todayStr = this.financeService.getTodayDateString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    // Agrupación preservando orden descendente de fechas
    const map = new Map<string, Movement[]>();
    for (const item of list) {
      const key = item.date || 'Sin fecha';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }

    const groups: MovementGroup[] = [];
    for (const [rawDate, items] of map.entries()) {
      let label = rawDate;
      if (rawDate === todayStr) {
        label = 'Hoy';
      } else if (rawDate === yesterdayStr) {
        label = 'Ayer';
      } else if (rawDate !== 'Sin fecha') {
        try {
          const parts = rawDate.split('-');
          if (parts.length === 3) {
            const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            const formatted = dateObj.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            });
            label = formatted.charAt(0).toUpperCase() + formatted.slice(1);
          }
        } catch {}
      }

      const totalDayExpense = items
        .filter((i) => i.type === 'expense')
        .reduce((sum, i) => sum + i.amount, 0);

      const totalDayIncome = items
        .filter((i) => i.type === 'income')
        .reduce((sum, i) => sum + i.amount, 0);

      groups.push({
        dateLabel: label,
        rawDate,
        totalDayExpense,
        totalDayIncome,
        items
      });
    }

    return groups;
  }

  getCategoryEmoji(catId: string): string {
    const map: Record<string, string> = {
      salario: '💼',
      freelance: '💻',
      inversiones: '📈',
      alimentacion: '🍔',
      vivienda: '🏠',
      transporte: '🚗',
      ocio: '🍿',
      salud: '💊',
      educacion: '📚',
      deudas: '📉',
      transferencia: '⇄',
      otros: '🏷️'
    };
    return map[catId] || '🏷️';
  }

  onTypeChange(type: 'all' | 'income' | 'expense' | 'transfer'): void {
    this.financeService.setTypeFilter(type);
  }

  onSearchChange(): void {
    this.financeService.setSearchTerm(this.searchQuery);
  }

  onCategoryChange(): void {
    this.financeService.setCategoryFilter(this.selectedCategory);
  }

  onAccountChange(): void {
    this.financeService.setAccountFilter(this.selectedAccount);
  }

  onEdit(item: Movement): void {
    this.financeService.openEditModal(item);
  }

  async onDelete(id: string): Promise<void> {
    if (confirm('¿Estás seguro de que deseas eliminar este movimiento?')) {
      await this.financeService.deleteMovement(id);
    }
  }

  openNewModal(): void {
    this.financeService.openModal();
  }

  getCategoryInfo(catId: string): CategoryInfo {
    return CATEGORIES[catId] || CATEGORIES['otros'];
  }

  getAccountInfo(accId: string): AccountInfo {
    return ACCOUNTS[accId] || ACCOUNTS['otra'];
  }

  applyDatePreset(preset: 'all' | 'today' | 'this_month'): void {
    this.datePreset = preset;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (preset === 'all') {
      this.startDate = '';
      this.endDate = '';
      this.financeService.clearDateFilter();
    } else if (preset === 'today') {
      this.startDate = todayStr;
      this.endDate = todayStr;
      this.financeService.setDateRangeFilter(todayStr, todayStr);
    } else if (preset === 'this_month') {
      this.startDate = `${year}-${month}-01`;
      this.endDate = todayStr;
      this.financeService.setDateRangeFilter(this.startDate, this.endDate);
    }
  }

  onCustomDateChange(): void {
    this.datePreset = 'custom';
    this.financeService.setDateRangeFilter(this.startDate, this.endDate);
  }

  clearDateFilter(): void {
    this.applyDatePreset('all');
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedAccount = 'all';
    this.financeService.setSearchTerm('');
    this.financeService.setCategoryFilter('all');
    this.financeService.setAccountFilter('all');
    this.financeService.setTypeFilter('all');
    this.applyDatePreset('all');
  }
}
