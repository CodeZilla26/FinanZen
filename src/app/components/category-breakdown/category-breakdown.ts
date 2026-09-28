import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FinanceService, CategoryBreakdownItem } from '../../services/finance.service';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './category-breakdown.html'
})
export class CategoryBreakdownComponent {
  protected readonly financeService = inject(FinanceService);

  get categoryExpenses(): CategoryBreakdownItem[] {
    return this.financeService.categoryExpenses();
  }

  get totalExpense(): number {
    return this.financeService.totalExpense();
  }
}
