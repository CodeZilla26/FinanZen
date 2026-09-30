import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { MovementType, CATEGORIES, ACCOUNTS } from '../../models/movement.model';

@Component({
  selector: 'app-movement-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movement-modal.html'
})
export class MovementModalComponent {
  protected readonly financeService = inject(FinanceService);

  readonly categories = Object.values(CATEGORIES);
  readonly accounts = Object.values(ACCOUNTS);
  readonly isSaving = signal<boolean>(false);

  // Form Fields
  type: MovementType = 'expense';
  title = '';
  amount: number | null = null;
  category = 'alimentacion';
  account = 'efectivo';
  toAccount = 'bcp';
  date = new Date().toISOString().substring(0, 10);

  constructor() {
    // Sincroniza automáticamente los campos cuando se selecciona un movimiento para editar
    effect(() => {
      const itemToEdit = this.financeService.editingMovement();
      if (itemToEdit) {
        this.type = itemToEdit.type;
        this.title = itemToEdit.title;
        this.amount = itemToEdit.amount;
        this.category = itemToEdit.category;
        this.account = itemToEdit.account || 'efectivo';
        this.toAccount = itemToEdit.toAccount || (itemToEdit.account === 'efectivo' ? 'bcp' : 'efectivo');
        this.date = itemToEdit.date;
      }
    });
  }

  get isOpen(): boolean {
    return this.financeService.isModalOpen();
  }

  get isEditing(): boolean {
    return this.financeService.editingMovement() !== null;
  }

  setType(type: MovementType): void {
    this.type = type;
    if (type === 'income' && (this.category === 'alimentacion' || this.category === 'transferencia')) {
      this.category = 'salario';
    } else if (type === 'expense' && (this.category === 'salario' || this.category === 'transferencia')) {
      this.category = 'alimentacion';
    } else if (type === 'transfer') {
      this.category = 'transferencia';
      if (this.account === this.toAccount) {
        this.toAccount = this.account === 'efectivo' ? 'bcp' : 'efectivo';
      }
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

    if (this.type === 'transfer' && this.account === this.toAccount) {
      alert('La cuenta de origen y la de destino no pueden ser iguales.');
      return;
    }

    this.isSaving.set(true);

    try {
      const itemToEdit = this.financeService.editingMovement();
      const payload = {
        title: this.title.trim(),
        amount: Number(this.amount),
        type: this.type,
        category: this.type === 'transfer' ? 'transferencia' : this.category,
        account: this.account,
        toAccount: this.type === 'transfer' ? this.toAccount : '',
        date: this.date || new Date().toISOString().substring(0, 10)
      };

      if (itemToEdit) {
        await this.financeService.updateMovement(itemToEdit.id, payload);
      } else {
        await this.financeService.addMovement(payload);
      }
      this.resetForm();
    } catch (err) {
      // El error se maneja en el servicio
    } finally {
      this.isSaving.set(false);
    }
  }

  private resetForm(): void {
    this.type = 'expense';
    this.title = '';
    this.amount = null;
    this.category = 'alimentacion';
    this.account = 'efectivo';
    this.toAccount = 'bcp';
    this.date = new Date().toISOString().substring(0, 10);
  }
}
