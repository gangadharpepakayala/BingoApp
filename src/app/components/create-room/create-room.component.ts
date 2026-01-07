import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoomService } from '../../services/room.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-create-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-room.component.html',
  styleUrls: ['./create-room.component.scss']
})
export class CreateRoomComponent implements OnInit {
  private router = inject(Router);
  private roomService = inject(RoomService);
  private http = inject(HttpClient);

  userName: string = '';
  roomName: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  ngOnInit(): void {
    this.userName = sessionStorage.getItem('userName') || 'User';
  }

  onCreateRoom(): void {
    if (!this.roomName.trim()) {
      this.errorMessage = 'Please enter a valid room name';
      return;
    }

    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      this.errorMessage = 'User not found. Please create an account first.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.roomService.createRoom(this.roomName, userId).subscribe({
      next: (response) => {
        // Store room info
        sessionStorage.setItem('roomId', response.id);
        sessionStorage.setItem('roomName', response.roomName);

        // Auto-join the created room
        const joinRequest = {
          userId: userId,
          roomId: response.id
        };

        this.http.post<any>(`${environment.apiUrl}/api/players/join`, joinRequest)
          .subscribe({
            next: (joinResponse) => {
              this.isLoading = false;
              sessionStorage.setItem('playerId', joinResponse.playerId);
              // Navigate to waiting room
              this.router.navigate(['/waiting-room']);
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = 'Failed to join room. Please try again.';
              console.error(err);
            }
          });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to create room. Please try again.';
        console.error(err);
      }
    });
  }

  onNavigateToJoin(): void {
    this.router.navigate(['/lobby']);
  }
}

