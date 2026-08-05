import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject, of, catchError } from 'rxjs';
import { API_URL } from './global-service';

export interface LoginRespuesta {
  succes: boolean;
  mensaje: string;
  id?: number;
  username?: string;
  nombre?: string;
  rol?: string;
  telefono?: string;
  correo?: string;
  activo?: boolean;
  idPromotora?: number;
  nombrePromotora?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<LoginRespuesta | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  verificarSesion(): Observable<LoginRespuesta> {
    return this.http.get<LoginRespuesta>(`${API_URL}/auth/me`).pipe(
      tap((res) => {
        if (res && res.succes) {
          this.currentUserSubject.next(res);
        } else {
          this.currentUserSubject.next(null);
        }
      }),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of({ succes: false, mensaje: 'Sesión no iniciada' });
      })
    );
  }

  login(username: string, password: string): Observable<LoginRespuesta> {
    return this.http.post<LoginRespuesta>(`${API_URL}/auth/login`, { username, password }).pipe(
      tap((res) => {
        if (res.succes) {
          this.currentUserSubject.next(res);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${API_URL}/auth/logout`, {}).pipe(
      tap({
        next: () => {
          this.currentUserSubject.next(null);
        },
        error: () => {
          this.currentUserSubject.next(null);
        }
      })
    );
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): LoginRespuesta | null {
    return this.currentUserSubject.value;
  }

  obtenerUsuario(id: number): Observable<LoginRespuesta> {
    return this.http.get<LoginRespuesta>(`${API_URL}/auth/usuario/${id}`);
  }

  actualizarUsuario(id: number, nombre: string, correo: string, telefono: string): Observable<LoginRespuesta> {
    return this.http.put<LoginRespuesta>(`${API_URL}/auth/usuario/${id}`, { nombre, correo, telefono }).pipe(
      tap((res) => {
        if (res.succes) {
          const currentUser = this.getCurrentUser();
          if (currentUser && currentUser.id === id) {
            const updatedUser = { 
              ...currentUser, 
              nombre: res.nombre, 
              correo: res.correo, 
              telefono: res.telefono 
            };
            this.currentUserSubject.next(updatedUser);
          }
        }
      })
    );
  }

  cambiarPassword(id: number, oldPassword: string, newPassword: string): Observable<LoginRespuesta> {
    return this.http.put<LoginRespuesta>(`${API_URL}/auth/usuario/${id}/password`, { oldPassword, newPassword });
  }

  getUsuarios(): Observable<LoginRespuesta[]> {
    return this.http.get<LoginRespuesta[]>(`${API_URL}/auth/usuarios`);
  }

  getTecnicos(): Observable<LoginRespuesta[]> {
    return this.http.get<LoginRespuesta[]>(`${API_URL}/auth/tecnicos`);
  }

  registrarUsuarioPorAdmin(dto: any): Observable<LoginRespuesta> {
    return this.http.post<LoginRespuesta>(`${API_URL}/auth/usuarios`, dto);
  }

  actualizarUsuarioPorAdmin(id: number, dto: any): Observable<LoginRespuesta> {
    return this.http.put<LoginRespuesta>(`${API_URL}/auth/usuarios/${id}`, dto);
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete<any>(`${API_URL}/auth/usuarios/${id}`);
  }
}
