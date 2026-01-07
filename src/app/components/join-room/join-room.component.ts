import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlayerService } from '../../services/player.service';
import { RoomService } from '../../services/room.service';

interface RoomOption {
  id: string;
  name: string;
  status: string;
}

@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './join-room.component.html',
  styleUrls: ['./join-room.component.scss']
})
export class JoinRoomComponent implements OnInit {
  private router = inject(Router);
  private playerService = inject(PlayerService);
  private roomService = inject(RoomService);

  rooms: RoomOption[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  selectedRoomId: string = '';

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Since there's no GET /api/rooms endpoint, we'll simulate room loading
    // In a real scenario, you'd fetch this from the backend
    // For now, we'll get the room from sessionStorage if it exists
    const roomId = sessionStorage.getItem('roomId');
    console.log('loadRooms - roomId from sessionStorage:', roomId);
    
    if (roomId) {
      this.rooms = [{
        id: roomId,
        name: 'Current Room',
        status: 'active'
      }];
    }
    this.isLoading = false;
  }

  onJoinRoom(roomId: string): void {
    const userId = sessionStorage.getItem('userId');
    console.log('Join Room - userId from session:', userId);
    console.log('Join Room - roomId:', roomId);
    
    if (!userId) {
      this.errorMessage = 'User not found. Please create an account first.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('Calling joinRoom with userId:', userId, 'roomId:', roomId);
    this.playerService.joinRoom(userId, roomId).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Successfully joined room:', response);
        // Store roomId and playerId from response
        sessionStorage.setItem('roomId', roomId);
        sessionStorage.setItem('playerId', response.playerId);
        this.router.navigate(['/ticket']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to join room. Please try again.';
        console.error('Error joining room:', err);
      }
    });
  }

  onNavigateBack(): void {
    this.router.navigate(['/room']);
  }
}
