import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Request DTO
export interface JoinRoomRequest {
  userId: string;
  roomId: string;
}

// Response interface
export interface PlayerResponse {
  id: string;
  userId: string;
  roomId: string;
  joinedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private apiUrl = `${environment.apiUrl}/api/players`;

  constructor(private http: HttpClient) { }

 joinRoom(userId: string, roomId: string): Observable<any> {
  const request: JoinRoomRequest = { userId, roomId };
  return this.http.post<any>(
    `${this.apiUrl}/join`,
    request
  );
}

leaveRoom(userId: string, roomId: string): Observable<any> {
  const request: JoinRoomRequest = { userId, roomId };
  return this.http.post<any>(
    `${this.apiUrl}/leave`,
    request
  );
}
}
