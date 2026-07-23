import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './global-service';
import { VisitasDto, VisitasRespuesta } from '../modelos/visitas.model';

@Injectable({
  providedIn: 'root'
})
export class VisitasService {
  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<VisitasRespuesta[]> {
    return this.http.get<VisitasRespuesta[]>(`${API_URL}/visitas`);
  }

  obtenerPorId(id: number): Observable<VisitasRespuesta> {
    return this.http.get<VisitasRespuesta>(`${API_URL}/visitas/${id}`);
  }

  insertar(dto: VisitasDto): Observable<VisitasRespuesta> {
    return this.http.post<VisitasRespuesta>(`${API_URL}/visitas`, dto);
  }

  actualizar(id: number, dto: VisitasDto): Observable<VisitasRespuesta> {
    return this.http.put<VisitasRespuesta>(`${API_URL}/visitas/${id}`, dto);
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(`${API_URL}/visitas/${id}`, { responseType: 'text' });
  }

  obtenerRecientesPorPromocion(idPromocion: number, limite: number = 10): Observable<VisitasRespuesta[]> {
    return this.http.get<VisitasRespuesta[]>(`${API_URL}/visitas/recientes/promocion/${idPromocion}?limite=${limite}`);
  }

  obtenerPorPromocion(idPromocion: number): Observable<VisitasRespuesta[]> {
    return this.http.get<VisitasRespuesta[]>(`${API_URL}/visitas/promocion/${idPromocion}`);
  }
}
