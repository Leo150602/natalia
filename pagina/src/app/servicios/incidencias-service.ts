import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './global-service';
import { IncidenciasDto, IncidenciasRespuesta, IncidenciasFiltroDto } from '../modelos/incidencias.model';

@Injectable({
  providedIn: 'root'
})
export class IncidenciasService {
  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<IncidenciasRespuesta[]> {
    return this.http.get<IncidenciasRespuesta[]>(`${API_URL}/incidencias`);
  }

  obtenerPorPromocion(idPromocion: number): Observable<IncidenciasRespuesta[]> {
    return this.http.get<IncidenciasRespuesta[]>(`${API_URL}/incidencias/promocion/${idPromocion}`);
  }

  obtenerPorId(id: string): Observable<IncidenciasRespuesta> {
    return this.http.get<IncidenciasRespuesta>(`${API_URL}/incidencias/${id}`);
  }

  insertar(dto: IncidenciasDto): Observable<IncidenciasRespuesta> {
    return this.http.post<IncidenciasRespuesta>(`${API_URL}/incidencias`, dto);
  }

  actualizar(id: string, dto: IncidenciasDto): Observable<IncidenciasRespuesta> {
    return this.http.put<IncidenciasRespuesta>(`${API_URL}/incidencias/${id}`, dto);
  }

  filtrar(filtro: IncidenciasFiltroDto): Observable<IncidenciasRespuesta[]> {
    return this.http.post<IncidenciasRespuesta[]>(`${API_URL}/incidencias/filtrar`, filtro);
  }

  importar(archivo: File, idPromocion: number): Observable<string> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post(`${API_URL}/incidencias/importar/${idPromocion}`, formData, { responseType: 'text' });
  }

  exportar(idPromocion: number): Observable<Blob> {
    return this.http.get(`${API_URL}/incidencias/exportar/${idPromocion}`, { responseType: 'blob' });
  }

  eliminar(id: string): Observable<string> {
    return this.http.delete(`${API_URL}/incidencias/${id}`, { responseType: 'text' });
  }

  obtenerCantidadPorPromocion(idPromocion: number): Observable<number> {
    return this.http.get<number>(`${API_URL}/incidencias/cantidad/promocion/${idPromocion}`);
  }
}
