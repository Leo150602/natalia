import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './global-service';
import { PromocionesDto, PromocionesRespuesta } from '../modelos/promociones.model';

@Injectable({
  providedIn: 'root'
})
export class PromocionesService {
  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<PromocionesRespuesta[]> {
    return this.http.get<PromocionesRespuesta[]>(`${API_URL}/promociones`);
  }

  obtenerPorId(id: number): Observable<PromocionesRespuesta> {
    return this.http.get<PromocionesRespuesta>(`${API_URL}/promociones/${id}`);
  }

  insertar(dto: PromocionesDto): Observable<PromocionesRespuesta> {
    return this.http.post<PromocionesRespuesta>(`${API_URL}/promociones`, dto);
  }

  actualizar(id: number, dto: PromocionesDto): Observable<PromocionesRespuesta> {
    return this.http.put<PromocionesRespuesta>(`${API_URL}/promociones/${id}`, dto);
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(`${API_URL}/promociones/${id}`, { responseType: 'text' });
  }
}
