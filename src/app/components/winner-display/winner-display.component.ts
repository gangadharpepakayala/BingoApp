import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
export class WinnerDisplayComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private http = inject(HttpClient);

  winner: { playerId: string; playerName: string; isDraw?: boolean } | null = null;
  userName: string = '';
  currentPlayerId: string = '';
  currentUserId: string = '';
  roomCreatorId: string = '';

  // Rematch Polling
  rematchRequested = false;
  private intervalId: any;
  roomId: string | null = null;

  ngOnInit(): void {
    const state = this.router.getCurrentNavigation()?.extras.state || history.state;
    this.winner = state?.winner || null;
    this.userName = sessionStorage.getItem('userName') || 'Player';
    this.currentPlayerId = sessionStorage.getItem('playerId') || '';
    this.currentUserId = sessionStorage.getItem('userId') || '';
    this.roomCreatorId = sessionStorage.getItem('roomCreatorId') || '';
    this.roomId = sessionStorage.getItem('roomId');

    // If no winner data, try to get it from sessionStorage
    if (!this.winner) {
      const winnerId = sessionStorage.getItem('winnerId');
      const winnerName = sessionStorage.getItem('winnerName');
      const isDraw = sessionStorage.getItem('isDraw') === 'true';

      if (winnerId && winnerName) {
        this.winner = { playerId: winnerId, playerName: winnerName, isDraw: isDraw };
      }
    }

    // Start polling if we have a room ID
    if (this.roomId) {
      this.intervalId = setInterval(() => this.pollGameStatus(), 2000);
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  pollGameStatus() {
    if (!this.roomId) return;

    this.http.get<any>(`${environment.apiUrl}/api/rooms/${this.roomId}`)
      .subscribe({
        next: (room) => {
          if (room && room.status === 'active') {
            // Game has been restarted!
            if (this.isRoomCreator()) {
              // Creator shouldn't really be here if status is active (they navigated away),
              // but if they are, they can go to game too.
              this.rematchRequested = true;
            } else {
              // Opponent detects active game
              this.rematchRequested = true;
            }
          }
        },
        error: (err) => console.error('Error polling game status:', err)
      });
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
    if (!this.roomId) {
      console.error('No room ID found');
      this.router.navigate(['/lobby']);
      return;
    }

    // Call restart endpoint
    this.http.post(`${environment.apiUrl}/api/game/restart`, { roomId: this.roomId })
      .subscribe({
        next: (data) => {
          console.log('Game restarted:', data);
          this.cleanupAndNavigate();
        },
        error: (err) => {
          console.error('Error restarting game:', err);
          alert('Failed to restart game. Please try again.');
        }
      });
  }

  onAcceptRematch(): void {
    this.cleanupAndNavigate();
  }

  private cleanupAndNavigate() {
    // Clear winner data but keep room and player info
    sessionStorage.removeItem('winnerId');
    sessionStorage.removeItem('winnerName');
    sessionStorage.removeItem('isDraw');

    // Navigate back to BINGO game page (NOT Draw Board)
    this.router.navigate(['/bingo-game']);
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
