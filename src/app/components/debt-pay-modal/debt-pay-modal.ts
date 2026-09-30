import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DebtService } from '../../services/debt.service';
import { ACCOUNTS } from '../../models/movement.model';
import { Debt } from '../../models/debt.model';

@Component({
  selector: 'app-debt-pay-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './debt-pay-modal.html'
})
export class DebtPayModalComponent {
  protected readonly debtService = inject(DebtService);

  readonly accounts = Object.values(ACCOUNTS);
  readonly isProcessing = signal<boolean>(false);

  selectedAccount = 'efectivo';
  paymentDate = new Date().toISOString().substring(0, 10);

  get isOpen(): boolean {
    return this.debtService.isPayModalOpen();
  }

  get debt(): Debt | null {
    return this.debtService.payingDebt();
  }

  close(): void {
    if (this.isProcessing()) return;
    this.debtService.closePayModal();
  }

  async onConfirmPay(): Promise<void> {
    const currentDebt = this.debt;
    if (!currentDebt || this.isProcessing()) return;

    this.isProcessing.set(true);

    try {
      await this.debtService.payDebt(currentDebt.id, this.selectedAccount, this.paymentDate);
    } catch (err) {
      // Error manejado en servicio
    } finally {
      this.isProcessing.set(false);
    }
  }
}
