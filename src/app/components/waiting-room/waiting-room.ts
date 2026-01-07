import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface RoomDetails {
  gameRoomId: string;
  roomName: string;
  status: string;
  playerCount: number;
}

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './waiting-room.html',
  styleUrls: ['./waiting-room.scss']
})
export class WaitingRoomComponent implements OnInit, OnDestroy {
  roomName = '';
  roomId = '';
  playerId = '';
  playerCount = 0;
  roomStatus = 'pending';
  private intervalId: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.roomId = sessionStorage.getItem('roomId') || '';
    this.roomName = sessionStorage.getItem('roomName') || '';
    this.playerId = sessionStorage.getItem('playerId') || '';

    if (!this.roomId || !this.playerId) {
      this.router.navigate(['/lobby']);
      return;
    }

    // Check room status every 2 seconds
    this.checkRoomStatus();
    this.intervalId = setInterval(() => this.checkRoomStatus(), 2000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  checkRoomStatus() {
    this.http.get<RoomDetails>(`${environment.apiUrl}/api/rooms/${this.roomId}`)
      .subscribe({
        next: (room) => {
          this.playerCount = room.playerCount;
          this.roomStatus = room.status;

          // If room is active (2 players joined), generate ticket and go to game
          if (room.status === 'active' && room.playerCount === 2) {
            this.generateTicketAndStartGame();
          }
        },
        error: (err) => {
          console.error('Error checking room status:', err);
        }
      });
  }

  generateTicketAndStartGame() {
    // Clear the interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Generate ticket
    this.http.post<any>(`${environment.apiUrl}/api/tickets/generate`, { playerId: this.playerId, roomId: this.roomId })
      .subscribe({
        next: () => {
          // Set first player's turn (get all players and set first one)
          this.http.get<any[]>(`${environment.apiUrl}/api/players/room/${this.roomId}`)
            .subscribe({
              next: (players) => {
                if (players && players.length > 0) {
                  const firstPlayer = players[0];
                  this.http.put(`${environment.apiUrl}/api/rooms/${this.roomId}/turn`,
                    JSON.stringify(firstPlayer.playerId),
                    { headers: { 'Content-Type': 'application/json' } }
                  ).subscribe({
                    next: () => {
                      // Navigate to bingo game
                      this.router.navigate(['/bingo-game']);
                    },
                    error: (err) => {
                      console.error('Error setting turn:', err);
                      this.router.navigate(['/bingo-game']);
                    }
                  });
                } else {
                  this.router.navigate(['/bingo-game']);
                }
              },
              error: (err) => {
                console.error('Error getting players:', err);
                this.router.navigate(['/bingo-game']);
              }
            });
        },
        error: (err) => {
          console.error('Error generating ticket:', err);
        }
      });
  }

  leaveRoom() {
    const leaveRequest = {
      userId: sessionStorage.getItem('userId'),
      roomId: this.roomId
    };

    this.http.post(`${environment.apiUrl}/api/players/leave`, leaveRequest)
      .subscribe({
        next: () => {
          sessionStorage.removeItem('roomId');
          sessionStorage.removeItem('playerId');
          sessionStorage.removeItem('roomName');
          this.router.navigate(['/lobby']);
        },
        error: (err) => {
          console.error('Error leaving room:', err);
          // Navigate anyway
          this.router.navigate(['/lobby']);
        }
      });
  }
}
