import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FinanceService } from '../../services/finance.service';
import { DebtService } from '../../services/debt.service';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './summary-cards.html'
})
export class SummaryCardsComponent {
  protected readonly financeService = inject(FinanceService);
  protected readonly debtService = inject(DebtService);

  get totalBalance(): number {
    return this.financeService.totalBalance();
  }

  get cashBalance(): number {
    return this.financeService.cashBalance();
  }

  get bankBalance(): number {
    return this.financeService.bankBalance();
  }

  get todayExpense(): number {
    return this.financeService.todayExpense();
  }

  get pendingDebtsCount(): number {
    return this.debtService.pendingCount();
  }

  openIncomeModal(): void {
    this.financeService.openModal({ type: 'income', category: 'salario' });
  }

  openExpenseModal(): void {
    this.financeService.openModal({ type: 'expense', category: 'alimentacion' });
  }

  openTransferModal(): void {
    this.financeService.openTransferModal();
  }

  openAccountsModal(): void {
    this.financeService.openAccountsModal();
  }

  openDebtsModal(): void {
    this.debtService.openListModal();
  }

  openCategoryModal(): void {
    this.financeService.openCategoryModal();
  }
}
