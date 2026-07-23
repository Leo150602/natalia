import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export const API_URL = window.location.port === '4200' ? 'http://localhost:8080/api' : '/api';

@Injectable({
  providedIn: 'root'
})
export class EstadoGlobalService {

  private promotoraSubject = new BehaviorSubject<string | null>(null);
  private promocionSubject = new BehaviorSubject<number | null>(null); // Guardamos el ID de la promoción
  private paginaActualSubject = new BehaviorSubject<string>('home');
  private sidebarColapsadoSubject = new BehaviorSubject<boolean>(false);

  promotora$ = this.promotoraSubject.asObservable();
  promocion$ = this.promocionSubject.asObservable();
  paginaActual$ = this.paginaActualSubject.asObservable();
  sidebarColapsado$ = this.sidebarColapsadoSubject.asObservable();

  setSidebarColapsado(colapsado: boolean): void {
    this.sidebarColapsadoSubject.next(colapsado);
  }

  getSidebarColapsado(): boolean {
    return this.sidebarColapsadoSubject.value;
  }

  setPromotora(promotora: string | null): void {
    this.promotoraSubject.next(promotora);
  }

  setPromocion(promocionId: number | null): void {
    this.promocionSubject.next(promocionId);
  }

  setPaginaActual(pagina: string): void {
    this.paginaActualSubject.next(pagina);
  }

  getPromotora(): string | null {
    return this.promotoraSubject.value;
  }

  getPromocion(): number | null {
    return this.promocionSubject.value;
  }

  getPaginaActual(): string {
    return this.paginaActualSubject.value;
  }
}