import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-ticket-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-board.component.html',
  styleUrls: ['./ticket-board.component.scss']
})
export class TicketBoardComponent implements OnInit {
  private router = inject(Router);
  private ticketService = inject(TicketService);

  ticket: number[][] = [];
  drawnNumbers: number[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  markedNumbers: Set<number> = new Set();

  ngOnInit(): void {
    this.loadTicket();
  }

  loadTicket(): void {
    const playerId = sessionStorage.getItem('playerId');
    const roomId = sessionStorage.getItem('roomId');
    if (!playerId) {
      this.errorMessage = 'Player not found. Please join a room first.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.ticketService.getTicket(playerId).subscribe({
      next: (ticketData) => {
        this.ticket = ticketData.numbers || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        // If ticket doesn't exist, generate one
        if (err.status === 404 && roomId) {
          this.generateTicket(playerId, roomId);
        } else {
          this.errorMessage = 'Failed to load ticket. Please try again.';
          console.error(err);
        }
      }
    });
  }

  generateTicket(playerId: string, roomId: string): void {
    this.ticketService.generateTicket(playerId, roomId).subscribe({
      next: (ticketData) => {
        this.ticket = ticketData.numbers || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to generate ticket. Please try again.';
        console.error(err);
      }
    });
  }

  isNumberMarked(number: number): boolean {
    return this.markedNumbers.has(number);
  }

  isNumberDrawn(number: number): boolean {
    return this.drawnNumbers.includes(number);
  }

  onMarkNumber(number: number): void {
    if (!this.isNumberDrawn(number)) {
      return; // Can't mark a number that hasn't been drawn
    }

    if (this.markedNumbers.has(number)) {
      this.markedNumbers.delete(number);
    } else {
      this.markedNumbers.add(number);
    }
  }

  isRowComplete(row: number): boolean {
    const rowNumbers = this.ticket[row] || [];
    return rowNumbers.every(num => this.markedNumbers.has(num));
  }

  isColumnComplete(col: number): boolean {
    for (let row = 0; row < 5; row++) {
      const number = this.ticket[row]?.[col];
      if (!number || !this.markedNumbers.has(number)) {
        return false;
      }
    }
    return true;
  }

  getRowClass(row: number): string {
    return this.isRowComplete(row) ? 'row-complete' : '';
  }

  getColumnHeaderClass(col: number): string {
    return this.isColumnComplete(col) ? 'col-complete' : '';
  }

  getCompletedRowCount(): number {
    let count = 0;
    for (let i = 0; i < 5; i++) {
      if (this.isRowComplete(i)) {
        count++;
      }
    }
    return count;
  }

  getCompletedColumnCount(): number {
    let count = 0;
    for (let i = 0; i < 5; i++) {
      if (this.isColumnComplete(i)) {
        count++;
      }
    }
    return count;
  }

  onStartGame(): void {
    this.router.navigate(['/game']);
  }

  onBack(): void {
    this.router.navigate(['/room']);
  }
}
