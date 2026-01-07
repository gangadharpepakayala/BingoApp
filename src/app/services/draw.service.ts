import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Response interface
export interface DrawResponse {
  drawnNumbers: number[];
  lastNumber?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DrawService {
  private apiUrl = `${environment.apiUrl}/api/draw`;

  constructor(private http: HttpClient) { }

  drawNumber(roomId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, { roomId });
  }

  getDrawnNumbers(roomId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${roomId}`);
  }
}
