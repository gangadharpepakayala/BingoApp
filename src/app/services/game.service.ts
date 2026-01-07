import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Response interface
export interface WinnerCheckResponse {
  winner: boolean;
  playerId?: string;
  playerName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = `${environment.apiUrl}/api/game`;

  constructor(private http: HttpClient) { }

  checkWinner(roomId: string): Observable<WinnerCheckResponse> {
    return this.http.post<WinnerCheckResponse>(`${this.apiUrl}/check-winner`, { roomId });
  }
}
