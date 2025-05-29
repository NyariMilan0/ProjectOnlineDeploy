/* Importok és komponens definíció */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../_services/auth.service';
import { ModalService } from '../../_services/modal.service';
import { Subscription } from 'rxjs';

interface PasswordChangeRequest {
  userId: number;
  oldPassword: string;
  newPassword: string;
}

interface UsernameChangeRequest {
  userId: number;
  newUsername: string;
}

interface ErrorResponse {
  status: string;
  statusCode: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})

/* Osztály és változók */
export class ProfileComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  private userId: number;
  passwordForm: FormGroup;
  usernameForm: FormGroup;
  message: string = '';
  messageClass: string = '';
  profilePictureUrl: string = '';
  showModal: boolean = false;

  /* Konstruktor */
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private modalService: ModalService
  ) {
    const storedId = localStorage.getItem('id');
    this.userId = storedId ? parseInt(storedId, 10) : 0;

    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6), this.passwordComplexityValidator()]],
      newPasswordAgain: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.usernameForm = this.fb.group({
      newUsername: ['', Validators.required]
    });
  }

  /* Inicializálás (ngOnInit) */
  ngOnInit(): void {
    this.subscription = this.modalService.showProfileModal$.subscribe(show => {
      this.showModal = show;
      if (show) {
        this.openModal();
      } else {
        this.closeModal();
      }
    });
    this.updateUserInfo();
  }

  /* Megsemmisítés (ngOnDestroy) */
  ngOnDestroy(): void {
    this.modalService.closeProfileModal();
    this.subscription.unsubscribe();
  }

  /* Validátorok (Validators) */
  passwordComplexityValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value || '';
      const hasLowercase = /[a-z]/.test(value);
      const hasUppercase = /[A-Z]/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      return hasLowercase && hasUppercase && hasSpecial ? null : { complexity: true };
    };
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const newPasswordAgain = form.get('newPasswordAgain')?.value;
    return newPassword === newPasswordAgain ? null : { mismatch: true };
  }

  /* Modál kezelés (Modal Handling) */
  openModal(): void {
    const modalElement = document.getElementById('profileModal');
    if (modalElement) {
      const bootstrap = (window as any).bootstrap;
      if (bootstrap && bootstrap.Modal) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }
  }

  closeModal(): void {
    const modalElement = document.getElementById('profileModal');
    if (modalElement) {
      const bootstrap = (window as any).bootstrap;
      if (bootstrap && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    }
  }

  /* Profil műveletek (Profile Actions) */
  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { oldPassword, newPassword } = this.passwordForm.value;
    const passwordRequest: PasswordChangeRequest = { userId: this.userId, oldPassword, newPassword };
    this.http.put('http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/user/passwordChangeByUserId', passwordRequest)
      .subscribe({
        next: () => {
          this.message = 'Password updated successfully!';
          this.messageClass = 'success-message';
          this.passwordForm.reset();
          this.updateUserInfo();
        },
        error: (error) => {
          const errorResponse: ErrorResponse = error.error;
          if (error.status === 400 || error.status === 403) {
            this.passwordForm.get('oldPassword')?.setErrors({ serverError: 'Password does not match' });
          } else if (errorResponse && errorResponse.status) {
            this.message = errorResponse.status === 'invalidNewPassword' 
              ? 'The new password is invalid. Please ensure it meets the requirements.' 
              : `Error: ${errorResponse.status} (Code: ${errorResponse.statusCode})`;
            this.messageClass = 'error-message';
          } else {
            this.message = 'An unexpected error occurred while updating the password.';
            this.messageClass = 'error-message';
          }
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
  }

  updateUsername(): void {
    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      return;
    }
    const { newUsername } = this.usernameForm.value;
    const usernameRequest: UsernameChangeRequest = { userId: this.userId, newUsername };
    this.http.put('http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/user/usernameChangeByUserId', usernameRequest)
      .subscribe({
        next: () => {
          this.message = 'Username updated successfully!';
          this.messageClass = 'success-message';
          localStorage.setItem('userName', newUsername);
          (document.getElementById('userName') as HTMLElement).textContent = newUsername;
          this.usernameForm.reset();
          this.updateUserInfo();
        },
        error: (error) => {
          const errorResponse: ErrorResponse = error.error;
          if (errorResponse && errorResponse.status) {
            this.message = errorResponse.status === 'invalidNewUsername' 
              ? 'The new username is invalid or already taken.' 
              : `Error: ${errorResponse.status} (Code: ${errorResponse.statusCode})`;
            this.messageClass = 'error-message';
          } else {
            this.message = 'An unexpected error occurred while updating the username.';
            this.messageClass = 'error-message';
          }
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
  }

  signOut(): void {
    this.closeModal();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /* Segéd függvények (Helper Functions) */
  private updateUserInfo(): void {
    (document.getElementById('userName') as HTMLElement).textContent = localStorage.getItem('userName') || 'Unknown';
    (document.getElementById('email') as HTMLElement).textContent = localStorage.getItem('email') || 'Unknown';
    (document.getElementById('firstName') as HTMLElement).textContent = localStorage.getItem('firstName') || 'Unknown';
    (document.getElementById('lastName') as HTMLElement).textContent = localStorage.getItem('lastName') || 'Unknown';
    const isAdmin = localStorage.getItem('isAdmin');
    (document.getElementById('role') as HTMLElement).textContent = isAdmin === 'true' ? 'Admin' : isAdmin === 'false' ? 'User' : 'Unknown';
  }
}