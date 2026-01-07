import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DrawService } from '../../services/draw.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-draw-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './draw-board.component.html',
  styleUrls: ['./draw-board.component.scss']
})
export class DrawBoardComponent implements OnInit {
  private router = inject(Router);
  private drawService = inject(DrawService);
  private gameService = inject(GameService);

  drawnNumbers: number[] = [];
  lastNumber: number | null = null;
  isLoading: boolean = false;
  isDrawing: boolean = false;
  errorMessage: string = '';
  gameEnded: boolean = false;
  winner: { playerId: string; playerName: string } | null = null;

  ngOnInit(): void {
    this.loadDrawnNumbers();
  }

  loadDrawnNumbers(): void {
    const roomId = sessionStorage.getItem('roomId');
    if (!roomId) {
      this.errorMessage = 'Room not found. Please join a room first.';
      return;
    }

    this.isLoading = true;
    this.drawService.getDrawnNumbers(roomId).subscribe({
      next: (response) => {
        this.drawnNumbers = response.drawnNumbers || [];
        this.lastNumber = response.lastNumber || null;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        // Initialize empty if no draws yet
        this.drawnNumbers = [];
      }
    });
  }

  onDrawNumber(): void {
    const roomId = sessionStorage.getItem('roomId');
    if (!roomId) {
      this.errorMessage = 'Room not found.';
      return;
    }

    if (this.isDrawing || this.gameEnded) {
      return;
    }

    this.isDrawing = true;
    this.errorMessage = '';

    this.drawService.drawNumber(roomId).subscribe({
      next: (response) => {
        this.drawnNumbers = response.drawnNumbers || [];
        this.lastNumber = response.lastNumber || null;
        this.isDrawing = false;

        // Check for winner after each draw
        this.checkForWinner();
      },
      error: (err) => {
        this.isDrawing = false;
        if (err.status === 400) {
          this.errorMessage = 'All numbers have been drawn!';
          this.gameEnded = true;
        } else {
          this.errorMessage = 'Failed to draw number. Please try again.';
        }
        console.error(err);
      }
    });
  }

  checkForWinner(): void {
    const roomId = sessionStorage.getItem('roomId');
    if (!roomId) {
      return;
    }

    this.gameService.checkWinner(roomId).subscribe({
      next: (response) => {
        if (response.winner) {
          this.gameEnded = true;
          this.winner = {
            playerId: response.playerId || '',
            playerName: response.playerName || 'Player'
          };
          // Navigate to winner screen
          setTimeout(() => {
            this.router.navigate(['/winner'], {
              state: { winner: this.winner }
            });
          }, 1000);
        }
      },
      error: (err) => {
        console.error('Error checking winner:', err);
      }
    });
  }

  getDrownNumbersGrid(): number[][] {
    const grid: number[][] = [];
    for (let i = 0; i < this.drawnNumbers.length; i += 5) {
      grid.push(this.drawnNumbers.slice(i, i + 5));
    }
    return grid;
  }

  onBack(): void {
    this.router.navigate(['/ticket']);
  }
}
