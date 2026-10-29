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

  obtenerPorPromocion(idPromocion: number, incluirSolicitudes: boolean = false): Observable<IncidenciasRespuesta[]> {
    return this.http.get<IncidenciasRespuesta[]>(`${API_URL}/incidencias/promocion/${idPromocion}?incluirSolicitudes=${incluirSolicitudes}`);
  }

  obtenerPorId(id: number): Observable<IncidenciasRespuesta> {
    return this.http.get<IncidenciasRespuesta>(`${API_URL}/incidencias/${id}`);
  }

  insertar(dto: IncidenciasDto): Observable<IncidenciasRespuesta> {
    return this.http.post<IncidenciasRespuesta>(`${API_URL}/incidencias`, dto);
  }

  actualizar(id: number, dto: IncidenciasDto): Observable<IncidenciasRespuesta> {
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

  exportar(idPromocion: number, filtros?: any, forzar = false): Observable<Blob> {
    let params: any = {};
    if (filtros) {
      if (filtros.numeroIncidencia) params.numeroIncidencia = filtros.numeroIncidencia;
      if (filtros.piso) params.piso = filtros.piso;
      if (filtros.categoriaIncidencia) params.categoriaIncidencia = filtros.categoriaIncidencia;
      if (filtros.estadoIncidencia) params.estadoIncidencia = filtros.estadoIncidencia;
      if (filtros.fechaInicial) params.fechaInicial = filtros.fechaInicial;
      if (filtros.fechaFinal) params.fechaFinal = filtros.fechaFinal;
    }
    if (forzar) {
      params.forzar = 'true';
    }
    return this.http.get(`${API_URL}/incidencias/exportar/${idPromocion}`, { params, responseType: 'blob' });
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(`${API_URL}/incidencias/${id}`, { responseType: 'text' });
  }

  obtenerCantidadPorPromocion(idPromocion: number): Observable<number> {
    return this.http.get<number>(`${API_URL}/incidencias/cantidad/promocion/${idPromocion}`);
  }
}
