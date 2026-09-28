import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards';
import { CategoryBreakdownComponent } from './components/category-breakdown/category-breakdown';
import { MovementListComponent } from './components/movement-list/movement-list';
import { MovementModalComponent } from './components/movement-modal/movement-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    SummaryCardsComponent,
    CategoryBreakdownComponent,
    MovementListComponent,
    MovementModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
