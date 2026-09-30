import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { Movement, CATEGORIES, CategoryInfo, ACCOUNTS, AccountInfo } from '../../models/movement.model';

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, FormsModule],
  templateUrl: './movement-list.html'
})
export class MovementListComponent {
  protected readonly financeService = inject(FinanceService);

  readonly categories = Object.values(CATEGORIES);
  readonly accounts = Object.values(ACCOUNTS);

  searchQuery = '';
  selectedCategory = 'all';
  selectedAccount = 'all';

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
    if (confirm('¿Estás seguro de que deseas eliminar este movimiento de Firebase?')) {
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
}
