import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-winner-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './winner-display.component.html',
  styleUrls: ['./winner-display.component.scss']
})
export class WinnerDisplayComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);

  winner: { playerId: string; playerName: string; isDraw?: boolean } | null = null;
  userName: string = '';
  currentPlayerId: string = '';
  currentUserId: string = '';
  roomCreatorId: string = '';

  ngOnInit(): void {
    const state = this.router.getCurrentNavigation()?.extras.state || history.state;
    this.winner = state?.winner || null;
    this.userName = sessionStorage.getItem('userName') || 'Player';
    this.currentPlayerId = sessionStorage.getItem('playerId') || '';
    this.currentUserId = sessionStorage.getItem('userId') || '';
    this.roomCreatorId = sessionStorage.getItem('roomCreatorId') || '';

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

  isWinner(): boolean {
    return this.winner?.playerId === this.currentPlayerId && !this.winner?.isDraw;
  }

  isLoser(): boolean {
    // Check if it's a draw first
    if (this.winner?.isDraw) {
      return false;
    }
    // Empty GUID means draw
    if (this.winner?.playerId === '00000000-0000-0000-0000-000000000000') {
      return false;
    }
    // Otherwise, loser if winner exists and it's not the current player
    return !!this.winner && this.winner.playerId !== this.currentPlayerId;
  }

  isDraw(): boolean {
    return this.winner?.isDraw === true;
  }

  isRoomCreator(): boolean {
    // Check if current user is the room creator
    return this.currentUserId === this.roomCreatorId && !!this.roomCreatorId;
  }

  onStartNewGame(): void {
    const roomId = sessionStorage.getItem('roomId');

    if (!roomId) {
      console.error('No room ID found');
      this.router.navigate(['/lobby']);
      return;
    }

    // Call restart endpoint
    this.http.post(`${environment.apiUrl}/api/game/restart`, { roomId: roomId })
      .subscribe({
        next: (data) => {
          console.log('Game restarted:', data);

          // Clear winner data but keep room and player info
          sessionStorage.removeItem('winnerId');
          sessionStorage.removeItem('winnerName');
          sessionStorage.removeItem('isDraw');

          // Navigate back to game page to play again in same room
          this.router.navigate(['/game']);
        },
        error: (err) => {
          console.error('Error restarting game:', err);
          alert('Failed to restart game. Please try again.');
        }
      });
  }

  onGameLobby(): void {
    // Clear winner and room data
    sessionStorage.removeItem('winnerId');
    sessionStorage.removeItem('winnerName');
    sessionStorage.removeItem('isDraw');
    sessionStorage.removeItem('roomId');

    // Navigate to lobby
    this.router.navigate(['/lobby']);
  }
}
