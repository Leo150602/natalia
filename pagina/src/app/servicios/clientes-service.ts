import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRespuesta } from './auth-service';

const API_URL = 'http://localhost:8080/api/auth';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  constructor(private http: HttpClient) {}

  listar(): Observable<LoginRespuesta[]> {
    return this.http.get<LoginRespuesta[]>(`${API_URL}/clientes`);
  }

  obtenerPorId(id: number): Observable<LoginRespuesta> {
    return this.http.get<LoginRespuesta>(`${API_URL}/usuarios/${id}`);
  }

  insertar(dto: any): Observable<any> {
    return this.http.post(`${API_URL}/usuarios`, dto);
  }

  actualizar(id: number, dto: any): Observable<any> {
    return this.http.put(`${API_URL}/usuarios/${id}`, dto);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/usuarios/${id}`);
  }
}
