import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Room {
  gameRoomId: string;
  roomName: string;
  status: string;
  playerCount: number;
  createdAt: string;
  createdByUserId?: string;
  expiresAt?: string;
}

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby.html',
  styleUrls: ['./lobby.scss']
})
export class LobbyComponent implements OnInit {
  rooms: Room[] = [];
  myRooms: Room[] = [];
  loading = false;
  error = '';
  userName = '';
  userId = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.userName = sessionStorage.getItem('userName') || '';
    this.userId = sessionStorage.getItem('userId') || '';

    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadRooms();
    this.loadMyRooms();
  }

  loadRooms() {
    this.http.get<Room[]>(`${environment.apiUrl}/api/rooms`)
      .subscribe({
        next: (rooms) => {
          this.rooms = rooms.filter(r => r.status !== 'completed');
        },
        error: (err) => {
          console.error('Error loading rooms:', err);
          this.error = 'Failed to load rooms';
        }
      });
  }

  loadMyRooms() {
    this.http.get<Room[]>(`${environment.apiUrl}/api/rooms/user/${this.userId}`)
      .subscribe({
        next: (rooms) => {
          this.myRooms = rooms;
        },
        error: (err) => {
          console.error('Error loading my rooms:', err);
        }
      });
  }

  joinRoom(room: Room) {
    if (room.playerCount >= 2) {
      this.error = 'Room is full!';
      return;
    }

    this.loading = true;
    this.error = '';

    const joinRequest = {
      userId: this.userId,
      roomId: room.gameRoomId
    };

    this.http.post<any>(`${environment.apiUrl}/api/players/join`, joinRequest)
      .subscribe({
        next: (response) => {
          sessionStorage.setItem('roomId', room.gameRoomId);
          sessionStorage.setItem('playerId', response.playerId);
          sessionStorage.setItem('roomName', room.roomName);
          // Store room creator ID to check permissions later
          if (room.createdByUserId) {
            sessionStorage.setItem('roomCreatorId', room.createdByUserId);
          }

          // Navigate to waiting room
          this.router.navigate(['/waiting-room']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to join room';
        }
      });
  }

  deleteRoom(roomId: string) {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    this.http.delete(`${environment.apiUrl}/api/rooms/${roomId}?userId=${this.userId}`)
      .subscribe({
        next: () => {
          window.location.reload();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to delete room';
        }
      });
  }

  createNewRoom() {
    this.router.navigate(['/room']);
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
