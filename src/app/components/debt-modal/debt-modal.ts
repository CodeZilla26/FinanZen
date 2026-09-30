import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DebtService } from '../../services/debt.service';
import { DebtType } from '../../models/debt.model';

@Component({
  selector: 'app-debt-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './debt-modal.html'
})
export class DebtModalComponent {
  protected readonly debtService = inject(DebtService);

  readonly isSaving = signal<boolean>(false);

  // Form Fields
  title = '';
  person = '';
  amount: number | null = null;
  type: DebtType = 'payable';
  date = new Date().toISOString().substring(0, 10);
  dueDate = '';
  notes = '';

  constructor() {
    effect(() => {
      const itemToEdit = this.debtService.editingDebt();
      if (itemToEdit) {
        this.title = itemToEdit.title;
        this.person = itemToEdit.person;
        this.amount = itemToEdit.amount;
        this.type = itemToEdit.type;
        this.date = itemToEdit.date;
        this.dueDate = itemToEdit.dueDate || '';
        this.notes = itemToEdit.notes || '';
      }
    });
  }

  get isOpen(): boolean {
    return this.debtService.isModalOpen();
  }

  get isEditing(): boolean {
    return this.debtService.editingDebt() !== null;
  }

  setType(type: DebtType): void {
    this.type = type;
  }

  close(): void {
    if (this.isSaving()) return;
    this.debtService.closeModal();
    this.resetForm();
  }

  async onSubmit(): Promise<void> {
    if (!this.title.trim() || !this.person.trim() || !this.amount || this.amount <= 0 || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    try {
      const itemToEdit = this.debtService.editingDebt();
      const payload = {
        title: this.title.trim(),
        person: this.person.trim(),
        amount: Number(this.amount),
        type: this.type,
        status: itemToEdit ? itemToEdit.status : 'pending' as const,
        date: this.date || new Date().toISOString().substring(0, 10),
        dueDate: this.dueDate || '',
        notes: this.notes.trim()
      };

      if (itemToEdit) {
        await this.debtService.updateDebt(itemToEdit.id, payload);
      } else {
        await this.debtService.addDebt(payload);
      }
      this.resetForm();
    } catch (err) {
      // Error manejado en servicio
    } finally {
      this.isSaving.set(false);
    }
  }

  private resetForm(): void {
    this.title = '';
    this.person = '';
    this.amount = null;
    this.type = 'payable';
    this.date = new Date().toISOString().substring(0, 10);
    this.dueDate = '';
    this.notes = '';
  }
}
