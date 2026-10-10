import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DebtService } from '../../services/debt.service';

@Component({
  selector: 'app-debt-summary-cards',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './debt-summary-cards.html'
})
export class DebtSummaryCardsComponent {
  protected readonly debtService = inject(DebtService);

  get totalPendingPayable(): number {
    return this.debtService.totalPendingPayable();
  }

  get totalPendingReceivable(): number {
    return this.debtService.totalPendingReceivable();
  }

  get totalPaid(): number {
    return this.debtService.totalPaid();
  }

  get pendingPayableCount(): number {
    return this.debtService.pendingPayableCount();
  }

  get pendingReceivableCount(): number {
    return this.debtService.debts().filter((d) => d.type === 'receivable' && d.status === 'pending').length;
  }

  get netDebtBalance(): number {
    return this.totalPendingReceivable - this.totalPendingPayable;
  }

  openNewDebtModal(): void {
    this.debtService.openModal();
  }
}
