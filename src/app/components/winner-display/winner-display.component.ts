import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-winner-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './winner-display.component.html',
  styleUrls: ['./winner-display.component.scss']
})
export class WinnerDisplayComponent implements OnInit {
  private router = inject(Router);

  winner: { playerId: string; playerName: string; isDraw?: boolean } | null = null;
  userName: string = '';

  ngOnInit(): void {
    const state = this.router.getCurrentNavigation()?.extras.state || history.state;
    this.winner = state?.winner || null;
    this.userName = sessionStorage.getItem('userName') || 'Player';

    // If no winner data, try to get it from sessionStorage
    if (!this.winner) {
      const winnerId = sessionStorage.getItem('winnerId');
      const winnerName = sessionStorage.getItem('winnerName');
      const isDraw = sessionStorage.getItem('isDraw') === 'true';

      if (winnerId && winnerName) {
        this.winner = { playerId: winnerId, playerName: winnerName, isDraw: isDraw };
      }
    }
  }

  onPlayAgain(): void {
    sessionStorage.clear();
    this.router.navigate(['/user']);
  }

  onBack(): void {
    this.router.navigate(['/lobby']);
  }
}
