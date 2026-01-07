import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent {
  private router = inject(Router);
  private userService = inject(UserService);

  userName: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  onCreateUser(): void {
    if (!this.userName.trim()) {
      this.errorMessage = 'Please enter a valid name';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.userService.createUser(this.userName).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Store userId in session storage for later use
        console.log('User created successfully:', response);
        console.log('UserId being stored:', response.id);
        sessionStorage.setItem('userId', response.id);
        sessionStorage.setItem('userName', response.username);
        this.router.navigate(['/lobby']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to create user. Please try again.';
        console.error('Error creating user:', err);
      }
    });
  }
}
