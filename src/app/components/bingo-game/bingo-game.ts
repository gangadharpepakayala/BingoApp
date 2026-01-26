import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Ticket {
  numbers: number[][];
  marked: boolean[][];
}

interface DrawnNumberEvent {
  number: number;
  playerId: string | null;
}

@Component({
  selector: 'app-bingo-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bingo-game.html',
  styleUrls: ['./bingo-game.scss']
})
export class BingoGameComponent implements OnInit, OnDestroy {
  playerId = '';
  roomId = '';
  userName = '';

  myTicket: Ticket = { numbers: [], marked: [] };
  calledNumbers: number[] = [];
  drawnHistory: DrawnNumberEvent[] = []; // Track history
  bingoLetters = ['B', 'I', 'N', 'G', 'O'];
  markedBingoLetters: boolean[] = [false, false, false, false, false];

  currentTurnPlayerId = '';
  isMyTurn = false;
  numberToCall = '';

  gameStatus = 'active';
  winner = '';

  private intervalId: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.playerId = sessionStorage.getItem('playerId') || '';
    this.roomId = sessionStorage.getItem('roomId') || '';
    this.userName = sessionStorage.getItem('userName') || '';

    if (!this.playerId || !this.roomId) {
      this.router.navigate(['/lobby']);
      return;
    }

    this.loadTicket();
    this.loadGameState();

    // Poll for game state every 2 seconds
    this.intervalId = setInterval(() => this.loadGameState(), 2000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  loadTicket() {
    this.http.get<any>(`${environment.apiUrl}/api/tickets/${this.playerId}`)
      .subscribe({
        next: (data) => {
          console.log('Ticket data received:', data);
          try {
            let ticketData: any[][] = [];
            if (data && typeof data === 'string') {
              // Try to parse if it's a string
              ticketData = JSON.parse(data);
            } else if (data && Array.isArray(data)) {
              ticketData = data;
            } else {
              console.error('Invalid ticket format received:', data);
              return;
            }

            // Ensure proper 5x5 grid structure and convert to numbers
            if (ticketData && ticketData.length === 5) {
              this.myTicket.numbers = ticketData.map(row => row.map(num => Number(num)));

              // Initialize marked array if it doesn't match dimensions or is empty
              if (!this.myTicket.marked || this.myTicket.marked.length !== 5) {
                this.myTicket.marked = this.myTicket.numbers.map(row =>
                  row.map(() => false)
                );
              }
              this.autoMarkNumbers();
            } else {
              console.error('Ticket data is not a 5x5 grid', this.myTicket.numbers);
            }
          } catch (e) {
            console.error('Error parsing ticket data:', e);
          }
        },
        error: (err) => console.error('Error loading ticket:', err)
      });
  }

  loadGameState() {
    // Get room details to check turn and status
    this.http.get<any>(`${environment.apiUrl}/api/rooms/${this.roomId}`)
      .subscribe({
        next: (room) => {
          this.currentTurnPlayerId = room.currentTurnPlayerId || '';
          this.isMyTurn = this.currentTurnPlayerId === this.playerId;
          this.gameStatus = room.status;

          if (this.gameStatus === 'completed') {
            // Game is over, check winner
            this.checkWinner();
          }
        },
        error: (err) => console.error('Error loading game state:', err)
      });

    // Get called numbers
    this.http.get<any>(`${environment.apiUrl}/api/draw/${this.roomId}`)
      .subscribe({
        next: (data) => {
          if (data && data.drawnNumbers) {
            // Map the drawn numbers object with checks for mixed casing
            this.drawnHistory = data.drawnNumbers.map((d: any) => ({
              number: Number(d.number !== undefined ? d.number : d.Number),
              playerId: (d.playerId !== undefined ? d.playerId : d.PlayerId) || null
            }));

            // Backward compatibility / safety check
            this.calledNumbers = this.drawnHistory
              .map(d => d.number)
              .filter(n => !isNaN(n));

            this.autoMarkNumbers();
          }
        },
        error: (err) => console.error('Error loading called numbers:', err)
      });
  }

  onTicketCellClick(num: number) {
    if (!this.isMyTurn || this.gameStatus !== 'active') {
      return;
    }

    if (this.calledNumbers.includes(num)) {
      return; // Already called
    }

    // Call the number immediately
    this.callNumber(num);
  }

  callNumber(selectedNumber?: number) {
    const num = selectedNumber || parseInt(this.numberToCall);

    if (!num || num < 1 || num > 25) {
      alert('Please enter a number between 1 and 25');
      return;
    }

    if (this.calledNumbers.includes(num)) {
      alert('This number has already been called!');
      return;
    }

    // Call the number
    this.http.post(`${environment.apiUrl}/api/draw`, {
      roomId: this.roomId,
      playerId: this.playerId, // Send Player ID
      number: num
    }).subscribe({
      next: () => {
        // Optimistic update for instant feedback
        if (!this.calledNumbers.includes(num)) {
          this.calledNumbers.push(num);
          this.drawnHistory.push({ number: num, playerId: this.playerId });
          this.autoMarkNumbers();
        }

        this.numberToCall = '';
        this.passTurn();
      },
      error: (err) => {
        console.error('Error calling number:', err);
        alert('Failed to call number');
      }
    });
  }

  passTurn() {
    // Get all players in room and pass turn to next player
    this.http.get<any[]>(`${environment.apiUrl}/api/players/room/${this.roomId}`)
      .subscribe({
        next: (players) => {
          const otherPlayer = players.find(p => p.playerId !== this.playerId);
          if (otherPlayer) {
            this.http.put(`${environment.apiUrl}/api/rooms/${this.roomId}/turn`,
              JSON.stringify(otherPlayer.playerId),
              { headers: { 'Content-Type': 'application/json' } }
            ).subscribe({
              next: () => this.loadGameState(),
              error: (err) => console.error('Error passing turn:', err)
            });
          }
        },
        error: (err) => console.error('Error getting players:', err)
      });
  }

  autoMarkNumbers() {
    // Auto-mark called numbers on the ticket
    for (let i = 0; i < this.myTicket.numbers.length; i++) {
      for (let j = 0; j < this.myTicket.numbers[i].length; j++) {
        const num = this.myTicket.numbers[i][j];
        if (this.calledNumbers.includes(num)) {
          this.myTicket.marked[i][j] = true;
        }
      }
    }

    this.checkBingoLetters();
  }

  toggleMark(row: number, col: number) {
    const num = this.myTicket.numbers[row][col];

    // Only allow marking if number has been called
    if (this.calledNumbers.includes(num)) {
      this.myTicket.marked[row][col] = !this.myTicket.marked[row][col];
      this.checkBingoLetters();
    }
  }

  checkBingoLetters() {
    const completedLines: number[] = [];

    // Check horizontal lines (rows)
    for (let i = 0; i < 5; i++) {
      if (this.myTicket.marked[i].every(m => m === true)) {
        completedLines.push(i);
      }
    }

    // Check vertical lines (columns)
    for (let j = 0; j < 5; j++) {
      const columnComplete = this.myTicket.marked.every(row => row[j] === true);
      if (columnComplete) {
        completedLines.push(5 + j); // Offset by 5 for columns
      }
    }

    // Mark BINGO letters based on completed lines
    for (let i = 0; i < Math.min(completedLines.length, 5); i++) {
      this.markedBingoLetters[i] = true;
    }

    console.log(`[Bingo] Lines completed: ${completedLines.length}. Bingo letters:`, this.markedBingoLetters);

    // Check if player won (all 5 letters marked)
    if (this.markedBingoLetters.every(l => l === true)) {
      console.log('[Bingo] BINGO ACHIEVED! Declaring winner...');
      this.declareWinner();
    }
  }

  declareWinner() {
    console.log('[Bingo] Sending check-winner request...');
    this.http.post(`${environment.apiUrl}/api/game/check-winner`, {
      roomId: this.roomId
    }).subscribe({
      next: (data: any) => {
        console.log('[Bingo] Check-winner response:', data);
        if (data && data.winner) {
          // Trigger the standard winner check/navigation
          this.checkWinner();
        } else {
          console.warn('[Bingo] Backend says NO WINNER yet.');
        }
      },
      error: (err) => console.error('Error declaring winner:', err)
    });
  }

  checkWinner() {
    this.http.get<any>(`${environment.apiUrl}/api/game/winner/${this.roomId}`)
      .subscribe({
        next: (data) => {
          if (data && data.winner) {
            // Store winner info for the winner page
            const winnerInfo = {
              playerId: data.playerId,
              playerName: data.winnerName,
              isDraw: data.isDraw || false
            };

            // Backup in storage
            sessionStorage.setItem('winnerId', winnerInfo.playerId);
            sessionStorage.setItem('winnerName', winnerInfo.playerName);
            sessionStorage.setItem('isDraw', String(winnerInfo.isDraw));

            this.winner = winnerInfo.playerName;

            // Navigate to winner page
            setTimeout(() => {
              this.router.navigate(['/winner'], { state: { winner: winnerInfo } });
            }, 1000);
          }
        },
        error: (err) => console.error('Error checking winner:', err)
      });
  }

  isNumberCalled(num: number): boolean {
    return this.calledNumbers.includes(num);
  }

  isMarked(row: number, col: number): boolean {
    return this.myTicket.marked[row] && this.myTicket.marked[row][col];
  }

  getCompletedLinesCount(): number {
    return this.markedBingoLetters.filter(letter => letter === true).length;
  }

  backToLobby() {
    this.router.navigate(['/lobby']);
  }

  isMyPick(num: number): boolean {
    return this.drawnHistory.some(d => d.number === num && d.playerId === this.playerId);
  }

  isOppPick(num: number): boolean {
    // If it's in history but NOT my ID, it's opp (or null if legacy)
    return this.drawnHistory.some(d => d.number === num && d.playerId !== this.playerId && d.playerId !== null);
  }
}
