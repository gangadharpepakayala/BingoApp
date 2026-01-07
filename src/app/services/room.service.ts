import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Request DTO
export interface CreateRoomRequest {
  roomName: string;
  userId: string;
}

// Response interface
export interface RoomResponse {
  id?: string;
  roomName: string;
  status?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = `${environment.apiUrl}/api/rooms`;

  constructor(private http: HttpClient) { }

  createRoom(roomName: string, userId: string): Observable<any> {
    const request: CreateRoomRequest = { roomName, userId };
    return this.http.post<any>(this.apiUrl, request);
  }

  updateRoomStatus(roomId: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${roomId}`, status);
  }

  deleteRoom(roomId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${roomId}`);
  }
}
