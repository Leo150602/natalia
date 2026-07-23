import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './global-service';
import { PromotorasDto, PromotorasRespuesta } from '../modelos/promotoras.model';

@Injectable({
  providedIn: 'root'
})
export class PromotorasService {
  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<PromotorasRespuesta[]> {
    return this.http.get<PromotorasRespuesta[]>(`${API_URL}/promotoras`);
  }

  obtenerPorId(id: number): Observable<PromotorasRespuesta> {
    return this.http.get<PromotorasRespuesta>(`${API_URL}/promotoras/${id}`);
  }

  insertar(dto: PromotorasDto): Observable<PromotorasRespuesta> {
    return this.http.post<PromotorasRespuesta>(`${API_URL}/promotoras`, dto);
  }

  actualizar(id: number, dto: PromotorasDto): Observable<PromotorasRespuesta> {
    return this.http.put<PromotorasRespuesta>(`${API_URL}/promotoras/${id}`, dto);
  }
}
