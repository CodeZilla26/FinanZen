import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { MovementType, CATEGORIES, ACCOUNTS, AccountInfo } from '../../models/movement.model';

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
    // Sincroniza automáticamente los campos cuando se selecciona un movimiento para editar o un preset
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
        return;
      }

      const preset = this.financeService.modalPreset();
      if (preset) {
        if (preset.type) this.type = preset.type;
        if (preset.title !== undefined) this.title = preset.title;
        if (preset.amount !== undefined) this.amount = preset.amount;
        if (preset.category) this.category = preset.category;
        if (preset.account) this.account = preset.account;
        if (preset.toAccount) this.toAccount = preset.toAccount;
        this.date = new Date().toISOString().substring(0, 10);
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

  // Atajos rápidos para transferencias comunes
  applyPresetWithdrawal(): void {
    this.type = 'transfer';
    this.category = 'transferencia';
    if (this.account === 'efectivo') {
      this.account = 'bcp';
    }
    this.toAccount = 'efectivo';
    this.title = 'Retiro de cajero a efectivo';
  }

  applyPresetTrainRecharge(): void {
    this.type = 'transfer';
    this.category = 'transferencia';
    this.account = 'efectivo';
    this.toAccount = 'tarjeta_tren';
    this.title = 'Recarga Tarjeta del Tren';
  }

  applyPresetBankTransfer(): void {
    this.type = 'transfer';
    this.category = 'transferencia';
    if (this.account === 'efectivo' || this.account === 'tarjeta_tren') {
      this.account = 'bcp';
    }
    this.toAccount = 'yape_plin';
    this.title = 'Transferencia entre cuentas';
  }

  getAccountInfo(accId: string): AccountInfo {
    return ACCOUNTS[accId] || ACCOUNTS['otra'];
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
