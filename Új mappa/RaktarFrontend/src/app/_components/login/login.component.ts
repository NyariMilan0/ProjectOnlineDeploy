/* Importok és komponens definíció */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../_services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

/* Osztály és változók */
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  message: string = '';
  messageClass: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  /* Konstruktor */
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  /* Inicializálás (ngOnInit) */
  ngOnInit(): void {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      this.loginForm.patchValue({
        username: savedUsername,
        rememberMe: true
      });
    }
  }

  /* Űrlap beküldése (onSubmit) */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.message = '';
      this.messageClass = '';

      const { username, password, rememberMe } = this.loginForm.value;
      
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      this.auth.login(username, password).subscribe({
        next: () => {
          this.messageClass = 'success';
          this.message = 'Login successful!';
          setTimeout(() => {
            this.router.navigate(['/storage']);
          }, 600);
        },
        error: (err) => {
          this.messageClass = 'error';
          this.message = err.error?.message || 'Invalid username or password!';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  /* Jelszó láthatóság váltása (togglePassword) */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}