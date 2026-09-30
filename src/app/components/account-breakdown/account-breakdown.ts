import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FinanceService, AccountSummaryItem } from '../../services/finance.service';

@Component({
  selector: 'app-account-breakdown',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './account-breakdown.html'
})
export class AccountBreakdownComponent {
  protected readonly financeService = inject(FinanceService);

  get accounts(): AccountSummaryItem[] {
    return this.financeService.accountsSummary();
  }

  get totalBalance(): number {
    return this.financeService.totalBalance();
  }
}
