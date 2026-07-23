import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './global-service';

@Injectable({
  providedIn: 'root'
})
export class EnumService {
  constructor(private http: HttpClient) {}

  obtenerTodosLosEnums(): Observable<any> {
    return this.http.get<any>(`${API_URL}/enums`);
  }
}
