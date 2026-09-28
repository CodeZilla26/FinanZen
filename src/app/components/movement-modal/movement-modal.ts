import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { MovementType, CATEGORIES } from '../../models/movement.model';

@Component({
  selector: 'app-movement-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movement-modal.html'
})
export class MovementModalComponent {
  protected readonly financeService = inject(FinanceService);

  readonly categories = Object.values(CATEGORIES);
  readonly isSaving = signal<boolean>(false);

  // Form Fields
  type: MovementType = 'expense';
  title = '';
  amount: number | null = null;
  category = 'alimentacion';
  date = new Date().toISOString().substring(0, 10);

  get isOpen(): boolean {
    return this.financeService.isModalOpen();
  }

  setType(type: MovementType): void {
    this.type = type;
    if (type === 'income' && this.category === 'alimentacion') {
      this.category = 'salario';
    } else if (type === 'expense' && this.category === 'salario') {
      this.category = 'alimentacion';
    }
  }

  close(): void {
    if (this.isSaving()) return;
    this.financeService.closeModal();
    this.resetForm();
  }

  async onSubmit(): Promise<void> {
    if (!this.title.trim() || !this.amount || this.amount <= 0 || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    try {
      await this.financeService.addMovement({
        title: this.title.trim(),
        amount: Number(this.amount),
        type: this.type,
        category: this.category,
        date: this.date || new Date().toISOString().substring(0, 10)
      });
      this.resetForm();
    } catch (err) {
      // Error is handled in the service alert
    } finally {
      this.isSaving.set(false);
    }
  }

  private resetForm(): void {
    this.type = 'expense';
    this.title = '';
    this.amount = null;
    this.category = 'alimentacion';
    this.date = new Date().toISOString().substring(0, 10);
  }
}
