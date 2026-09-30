import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards';
import { CategoryBreakdownComponent } from './components/category-breakdown/category-breakdown';
import { AccountBreakdownComponent } from './components/account-breakdown/account-breakdown';
import { MovementListComponent } from './components/movement-list/movement-list';
import { MovementModalComponent } from './components/movement-modal/movement-modal';
import { DebtListComponent } from './components/debt-list/debt-list';
import { DebtModalComponent } from './components/debt-modal/debt-modal';
import { DebtPayModalComponent } from './components/debt-pay-modal/debt-pay-modal';
import { DebtService } from './services/debt.service';
import { FinanceService } from './services/finance.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    SummaryCardsComponent,
    CategoryBreakdownComponent,
    AccountBreakdownComponent,
    MovementListComponent,
    MovementModalComponent,
    DebtListComponent,
    DebtModalComponent,
    DebtPayModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly debtService = inject(DebtService);
  protected readonly financeService = inject(FinanceService);

  activeTab: 'movements' | 'debts' = 'movements';

  setTab(tab: 'movements' | 'debts'): void {
    this.activeTab = tab;
  }

  get pendingDebtsCount(): number {
    return this.debtService.pendingPayableCount();
  }

  get totalMovementsCount(): number {
    return this.financeService.movements().length;
  }
}
