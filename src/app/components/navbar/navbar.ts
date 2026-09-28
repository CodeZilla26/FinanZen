import { Component, inject } from '@angular/core';
import { FinanceService } from '../../services/finance.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html'
})
export class NavbarComponent {
  protected readonly financeService = inject(FinanceService);
  protected readonly themeService = inject(ThemeService);

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  openNewMovement(): void {
    this.financeService.openModal();
  }
}
