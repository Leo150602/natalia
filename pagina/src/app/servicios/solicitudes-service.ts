import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IncidenciasRespuesta } from '../modelos/incidencias.model';

const API_URL = 'http://localhost:8080/api';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {

  constructor(private http: HttpClient) {}

  obtenerSolicitudes(idPromocion?: number): Observable<IncidenciasRespuesta[]> {
    const url = idPromocion ? `${API_URL}/solicitudes?idPromocion=${idPromocion}` : `${API_URL}/solicitudes`;
    return this.http.get<IncidenciasRespuesta[]>(url);
  }

  aceptarSolicitud(id: number): Observable<string> {
    return this.http.post(`${API_URL}/solicitudes/aceptar/${id}`, {}, { responseType: 'text' });
  }

  rechazarSolicitud(id: number): Observable<string> {
    return this.http.post(`${API_URL}/solicitudes/rechazar/${id}`, {}, { responseType: 'text' });
  }

  aceptarMultiples(ids: number[]): Observable<string> {
    return this.http.post(`${API_URL}/solicitudes/aceptar-multiples`, ids, { responseType: 'text' });
  }

  rechazarMultiples(ids: number[]): Observable<string> {
    return this.http.post(`${API_URL}/solicitudes/rechazar-multiples`, ids, { responseType: 'text' });
  }
}
