import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Response interface
export interface TicketResponse {
  id: string;
  playerId: string;
  numbers: number[][];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${environment.apiUrl}/api/tickets`;

  constructor(private http: HttpClient) { }

  generateTicket(playerId: string, roomId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate?playerId=${playerId}&roomId=${roomId}`, {});
  }

  getTicket(playerId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${playerId}`);
  }
}
