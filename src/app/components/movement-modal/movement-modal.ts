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
  toAccount = 'tarjeta_tren';
  date = new Date().toISOString().substring(0, 10);

  constructor() {
    // Sincroniza automáticamente los campos cuando se selecciona un movimiento para editar o se activa un preset
    effect(() => {
      const itemToEdit = this.financeService.editingMovement();
      if (itemToEdit) {
        this.type = itemToEdit.type;
        this.title = itemToEdit.title;
        this.amount = itemToEdit.amount;
        this.category = itemToEdit.category;
        this.account = itemToEdit.account || 'efectivo';
        this.toAccount = itemToEdit.toAccount || (itemToEdit.account === 'efectivo' ? 'tarjeta_tren' : 'efectivo');
        this.date = itemToEdit.date;
        return;
      }

      const preset = this.financeService.initialModalPreset();
      if (preset) {
        if (preset.type) this.type = preset.type;
        if (preset.account) this.account = preset.account;
        if (preset.toAccount) this.toAccount = preset.toAccount;
        if (preset.title) this.title = preset.title;
        if (preset.amount !== undefined && preset.amount !== null) this.amount = preset.amount;
        if (preset.type === 'transfer') {
          this.category = 'transferencia';
        }
      }
    });
  }

  get isOpen(): boolean {
    return this.financeService.isModalOpen();
  }

  get isEditing(): boolean {
    return this.financeService.editingMovement() !== null;
  }

  get isTrainCardTransfer(): boolean {
    return this.type === 'transfer' && this.toAccount === 'tarjeta_tren';
  }

  get isCashWithdrawal(): boolean {
    return this.type === 'transfer' && this.toAccount === 'efectivo';
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
        this.toAccount = this.account === 'efectivo' ? 'tarjeta_tren' : 'efectivo';
      }
    }
  }

  applyTransferPreset(preset: 'train' | 'withdrawal' | 'general'): void {
    this.setType('transfer');
    if (preset === 'train') {
      this.account = 'efectivo';
      this.toAccount = 'tarjeta_tren';
      if (!this.title.trim() || this.title === 'Retiro de efectivo en cajero' || this.title === 'Transferencia entre cuentas') {
        this.title = 'Recarga Tarjeta del Tren';
      }
    } else if (preset === 'withdrawal') {
      if (this.account === 'efectivo' || this.account === 'tarjeta_tren') {
        this.account = 'bcp';
      }
      this.toAccount = 'efectivo';
      if (!this.title.trim() || this.title === 'Recarga Tarjeta del Tren' || this.title === 'Transferencia entre cuentas') {
        this.title = 'Retiro de efectivo en cajero';
      }
    } else {
      if (this.account === this.toAccount) {
        this.toAccount = this.account === 'bcp' ? 'bbva' : 'bcp';
      }
      if (!this.title.trim() || this.title === 'Recarga Tarjeta del Tren' || this.title === 'Retiro de efectivo en cajero') {
        this.title = 'Transferencia entre cuentas';
      }
    }
  }

  onToAccountChange(): void {
    // Si el destino es la tarjeta del tren, según el requerimiento el dinero sale directamente de efectivo
    if (this.toAccount === 'tarjeta_tren') {
      this.account = 'efectivo';
      if (!this.title.trim() || this.title === 'Retiro de efectivo en cajero' || this.title === 'Transferencia entre cuentas') {
        this.title = 'Recarga Tarjeta del Tren';
      }
    } else if (this.toAccount === 'efectivo' && this.account === 'efectivo') {
      this.account = 'bcp';
      if (!this.title.trim() || this.title === 'Recarga Tarjeta del Tren') {
        this.title = 'Retiro de efectivo en cajero';
      }
    }
  }

  getAccountName(accId: string): string {
    return ACCOUNTS[accId]?.name || accId;
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
