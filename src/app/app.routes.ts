import { Routes } from '@angular/router';
import { CreateUserComponent } from './components/create-user/create-user.component';
import { CreateRoomComponent } from './components/create-room/create-room.component';
import { JoinRoomComponent } from './components/join-room/join-room.component';
import { TicketBoardComponent } from './components/ticket-board/ticket-board.component';
import { DrawBoardComponent } from './components/draw-board/draw-board.component';
import { WinnerDisplayComponent } from './components/winner-display/winner-display.component';
import { LobbyComponent } from './components/lobby/lobby';
import { WaitingRoomComponent } from './components/waiting-room/waiting-room';
import { BingoGameComponent } from './components/bingo-game/bingo-game';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'user', component: CreateUserComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: 'room', component: CreateRoomComponent },
  { path: 'join', component: JoinRoomComponent },
  { path: 'waiting-room', component: WaitingRoomComponent },
  { path: 'bingo-game', component: BingoGameComponent },
  { path: 'ticket', component: TicketBoardComponent },
  { path: 'game', component: DrawBoardComponent },
  { path: 'winner', component: WinnerDisplayComponent },
  { path: '**', redirectTo: '/login' }
];

