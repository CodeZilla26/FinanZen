import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './summary-cards.html'
})
export class SummaryCardsComponent {
  protected readonly financeService = inject(FinanceService);

  get totalBalance(): number {
    return this.financeService.totalBalance();
  }

  get totalIncome(): number {
    return this.financeService.totalIncome();
  }

  get totalExpense(): number {
    return this.financeService.totalExpense();
  }

  get todayExpense(): number {
    return this.financeService.todayExpense();
  }

  get savingsRate(): number {
    return this.financeService.savingsRate();
  }
}
