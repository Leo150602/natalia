import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRespuesta } from './auth-service';
import { API_URL } from './global-service';

const AUTH_API_URL = `${API_URL}/auth`;

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  constructor(private http: HttpClient) {}

  listar(): Observable<LoginRespuesta[]> {
    return this.http.get<LoginRespuesta[]>(`${AUTH_API_URL}/clientes`);
  }

  obtenerPorId(id: number): Observable<LoginRespuesta> {
    return this.http.get<LoginRespuesta>(`${AUTH_API_URL}/usuarios/${id}`);
  }

  insertar(dto: any): Observable<any> {
    return this.http.post(`${AUTH_API_URL}/usuarios`, dto);
  }

  actualizar(id: number, dto: any): Observable<any> {
    return this.http.put(`${AUTH_API_URL}/usuarios/${id}`, dto);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${AUTH_API_URL}/usuarios/${id}`);
  }
}
