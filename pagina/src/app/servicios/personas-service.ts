import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './global-service';
import { PersonasDto, PersonasRespuesta } from '../modelos/personas.model';

@Injectable({
  providedIn: 'root'
})
export class PersonasService {
  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<PersonasRespuesta[]> {
    return this.http.get<PersonasRespuesta[]>(`${API_URL}/personas`);
  }

  obtenerPorId(id: number): Observable<PersonasRespuesta> {
    return this.http.get<PersonasRespuesta>(`${API_URL}/personas/${id}`);
  }

  insertar(dto: PersonasDto): Observable<PersonasRespuesta> {
    return this.http.post<PersonasRespuesta>(`${API_URL}/personas`, dto);
  }

  actualizar(id: number, dto: PersonasDto): Observable<PersonasRespuesta> {
    return this.http.put<PersonasRespuesta>(`${API_URL}/personas/${id}`, dto);
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(`${API_URL}/personas/${id}`, { responseType: 'text' });
  }

  obtenerPropietariosPorPromocion(idPromocion: number): Observable<PersonasRespuesta[]> {
    return this.http.get<PersonasRespuesta[]>(`${API_URL}/personas/promocion/${idPromocion}`);
  }
}
