import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummaryCardsComponent } from '../summary-cards/summary-cards';
import { DebtSummaryCardsComponent } from '../debt-summary-cards/debt-summary-cards';
import { FinanceService } from '../../services/finance.service';
import { DebtService } from '../../services/debt.service';

@Component({
  selector: 'app-summary-modal',
  standalone: true,
  imports: [CommonModule, SummaryCardsComponent, DebtSummaryCardsComponent],
  templateUrl: './summary-modal.html'
})
export class SummaryModalComponent {
  protected readonly financeService = inject(FinanceService);
  protected readonly debtService = inject(DebtService);

  get isOpen(): boolean {
    return this.financeService.isSummaryModalOpen();
  }

  get activeTab(): 'financial' | 'debts' {
    return this.financeService.summaryModalTab();
  }

  setTab(tab: 'financial' | 'debts'): void {
    this.financeService.setSummaryModalTab(tab);
  }

  close(): void {
    this.financeService.closeSummaryModal();
  }

  openAccountsModal(): void {
    this.financeService.openAccountsModal();
  }

  openCategoryModal(): void {
    this.financeService.openCategoryModal();
  }

  openNewMovement(): void {
    this.financeService.openModal();
  }

  openNewDebt(): void {
    this.close();
    this.debtService.openModal();
  }
}
