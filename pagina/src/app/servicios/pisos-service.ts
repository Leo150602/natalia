import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './global-service';
import { PisosDto, PisosRespuesta } from '../modelos/pisos.model';

@Injectable({
  providedIn: 'root'
})
export class PisosService {
  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<PisosRespuesta[]> {
    return this.http.get<PisosRespuesta[]>(`${API_URL}/pisos`);
  }

  obtenerPorPromocion(idPromocion: number): Observable<PisosRespuesta[]> {
    return this.http.get<PisosRespuesta[]>(`${API_URL}/pisos/promocion/${idPromocion}`);
  }

  obtenerPorId(id: number): Observable<PisosRespuesta> {
    return this.http.get<PisosRespuesta>(`${API_URL}/pisos/${id}`);
  }

  insertar(dto: PisosDto): Observable<PisosRespuesta> {
    return this.http.post<PisosRespuesta>(`${API_URL}/pisos`, dto);
  }

  actualizar(id: number, dto: PisosDto): Observable<PisosRespuesta> {
    return this.http.put<PisosRespuesta>(`${API_URL}/pisos/${id}`, dto);
  }

  importar(archivo: File, idPromocion: number): Observable<string> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post(`${API_URL}/pisos/importar/${idPromocion}`, formData, { responseType: 'text' });
  }

  exportar(idPromocion: number): Observable<Blob> {
    return this.http.get(`${API_URL}/pisos/exportar/${idPromocion}`, { responseType: 'blob' });
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(`${API_URL}/pisos/${id}`, { responseType: 'text' });
  }

  obtenerCantidadPorPromocion(idPromocion: number): Observable<number> {
    return this.http.get<number>(`${API_URL}/pisos/cantidad/promocion/${idPromocion}`);
  }
}
