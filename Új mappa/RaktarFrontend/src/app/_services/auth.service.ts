import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/user/login';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { userName: username, password }).pipe(
      tap(res => {
        localStorage.setItem('jwtToken', res.result.jwt);
        localStorage.setItem('id', res.result.id);
        localStorage.setItem('userName', res.result.userName);
        localStorage.setItem('firstName', res.result.firstName);
        localStorage.setItem('lastName', res.result.lastName);
        localStorage.setItem('email', res.result.email);
        localStorage.setItem('isAdmin', res.result.isAdmin);
      }),
      catchError(this.handleError)
    );
  }

  logout() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('email');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('userName');
    localStorage.removeItem('id');
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error.message || 'Invalid credentials';
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwtToken');
  }
}