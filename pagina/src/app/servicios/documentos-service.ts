import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './global-service';

export interface DocumentoRespuesta {
  id: number;
  nombre: string;
  fechaMontado: string;
  tipoDocumento: string;
  formato: string;
  ruta: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  
  constructor(private http: HttpClient) {}

  listar(): Observable<DocumentoRespuesta[]> {
    return this.http.get<DocumentoRespuesta[]>(`${API_URL}/documentos`);
  }

  subir(archivo: File, tipo: string, nombre?: string): Observable<DocumentoRespuesta> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tipo', tipo);
    if (nombre) {
      formData.append('nombre', nombre);
    }
    return this.http.post<DocumentoRespuesta>(`${API_URL}/documentos/subir`, formData);
  }

  actualizar(id: number, archivo?: File, nombre?: string): Observable<DocumentoRespuesta> {
    const formData = new FormData();
    if (archivo) {
      formData.append('archivo', archivo);
    }
    if (nombre) {
      formData.append('nombre', nombre);
    }
    return this.http.put<DocumentoRespuesta>(`${API_URL}/documentos/${id}`, formData);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/documentos/${id}`);
  }

  // --- Endpoints de Documentos de Incidencias ---

  listarPorIncidencia(idIncidencia: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/incidencias/${idIncidencia}/documentos`);
  }

  subirParaIncidencia(idIncidencia: number, archivo: File, estado: string, nombre?: string): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('estado', estado);
    if (nombre) {
      formData.append('nombre', nombre);
    }
    return this.http.post<any>(`${API_URL}/incidencias/${idIncidencia}/documentos/subir`, formData);
  }

  actualizarIncidenciaDocumento(id: number, archivo?: File, estado?: string, nombre?: string): Observable<any> {
    const formData = new FormData();
    if (archivo) {
      formData.append('archivo', archivo);
    }
    if (estado) {
      formData.append('estado', estado);
    }
    if (nombre) {
      formData.append('nombre', nombre);
    }
    return this.http.put<any>(`${API_URL}/incidencias/documentos/${id}`, formData);
  }

  eliminarIncidenciaDocumento(id: number): Observable<string> {
    return this.http.delete(`${API_URL}/incidencias/documentos/${id}`, { responseType: 'text' });
  }

  obtenerUrlDescarga(id: number): string {
    return `${API_URL}/documentos/${id}/descargar`;
  }

  descargarDocumentoAsBlob(id: number): Observable<Blob> {
    return this.http.get(`${API_URL}/documentos/${id}/descargar`, { responseType: 'blob' });
  }
}
