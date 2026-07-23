import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from './global-service';

export interface LoginRespuesta {
  succes: boolean;
  mensaje: string;
  id?: number;
  username?: string;
  nombre?: string;
  rol?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'natalia_currentUser';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginRespuesta> {
    return this.http.post<LoginRespuesta>(`${API_URL}/auth/login`, { username, password }).pipe(
      tap((res) => {
        if (res.succes) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(res));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem(this.USER_KEY) !== null;
  }

  getCurrentUser(): LoginRespuesta | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as LoginRespuesta;
    } catch {
      return null;
    }
  }
}
