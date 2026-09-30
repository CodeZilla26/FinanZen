import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DebtService } from '../../services/debt.service';
import { Debt, DebtStatus, DebtType } from '../../models/debt.model';
import { ACCOUNTS } from '../../models/movement.model';

@Component({
  selector: 'app-debt-list',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, FormsModule],
  templateUrl: './debt-list.html'
})
export class DebtListComponent {
  protected readonly debtService = inject(DebtService);

  searchQuery = '';
  selectedStatus: 'all' | 'pending' | 'paid' = 'all';
  selectedType: 'all' | 'payable' | 'receivable' = 'all';

  get filteredDebts(): Debt[] {
    return this.debtService.filteredDebts();
  }

  get totalPendingPayable(): number {
    return this.debtService.totalPendingPayable();
  }

  get totalPendingReceivable(): number {
    return this.debtService.totalPendingReceivable();
  }

  get totalPaid(): number {
    return this.debtService.totalPaid();
  }

  get pendingCount(): number {
    return this.debtService.pendingCount();
  }

  get isLoading(): boolean {
    return this.debtService.isLoading();
  }

  get errorMessage(): string | null {
    return this.debtService.errorMessage();
  }

  onStatusChange(status: 'all' | 'pending' | 'paid'): void {
    this.selectedStatus = status;
    this.debtService.setStatusFilter(status);
  }

  onTypeChange(type: 'all' | 'payable' | 'receivable'): void {
    this.selectedType = type;
    this.debtService.setTypeFilter(type);
  }

  onSearchChange(): void {
    this.debtService.setSearchTerm(this.searchQuery);
  }

  openNewModal(): void {
    this.debtService.openModal();
  }

  onEdit(debt: Debt): void {
    this.debtService.openEditModal(debt);
  }

  onPay(debt: Debt): void {
    this.debtService.openPayModal(debt);
  }

  async onDelete(id: string): Promise<void> {
    if (confirm('¿Estás seguro de que deseas eliminar este registro de deuda?')) {
      await this.debtService.deleteDebt(id);
    }
  }

  getAccountName(accId?: string): string {
    if (!accId) return '';
    return ACCOUNTS[accId]?.name || accId;
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    const today = new Date().toISOString().substring(0, 10);
    return dueDate < today;
  }
}
