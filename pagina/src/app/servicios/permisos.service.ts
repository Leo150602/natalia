import { Injectable } from '@angular/core';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {

  constructor(private authService: AuthService) {}

  getRol(): string {
    const user = this.authService.getCurrentUser();
    return user ? (user.rol || '').toUpperCase() : '';
  }

  esAdminODev(): boolean {
    const rol = this.getRol();
    return rol === 'ADMINISTRADOR' || rol === 'DESARROLLADOR';
  }

  esEmpleado(): boolean {
    return this.getRol() === 'EMPLEADO';
  }

  esCliente(): boolean {
    return this.getRol() === 'CLIENTE';
  }

  esTecnico(): boolean {
    return this.getRol() === 'TECNICO';
  }

  puedeVerMenuAdministracion(): boolean {
    return this.esAdminODev() || this.puedeInsertarEditar();
  }

  puedeVerPromociones(): boolean {
    return this.esAdminODev() || this.puedeInsertarEditar();
  }

  puedeVerPisosYPropietarios(): boolean {
    return !this.esTecnico(); // El técnico no debería ver ni crear los pisos ni propietarios
  }

  puedeInsertarEditar(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    const usernameLower = (user.username || '').toLowerCase().trim();
    const rolUpper = (user.rol || '').toUpperCase().trim();
    return rolUpper === 'DESARROLLADOR' || usernameLower === 'nataforonda' || user.id === 2;
  }

  puedeVerPlantillas(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    const rolUpper = (user.rol || '').toUpperCase().trim();
    return rolUpper === 'DESARROLLADOR' || user.id === 2;
  }

  puedeRegistrarUsuarios(): boolean {
    return this.puedeInsertarEditar() || this.getRol() === 'ADMINISTRADOR';
  }

  puedeInsertarEditarIncidencias(): boolean {
    return this.puedeInsertarEditar();
  }

  puedeVerSolicitudes(): boolean {
    return this.esAdminODev() || this.esEmpleado();
  }

  puedeAdministrarClientes(): boolean {
    return this.esAdminODev() || this.esEmpleado();
  }

  puedeCrearSolicitudes(): boolean {
    return this.esCliente() || this.esTecnico();
  }

  puedeInsertarEditarPisosYPropietarios(): boolean {
    return this.puedeInsertarEditar();
  }

  obtenerEtiquetaPersonas(): string {
    return 'Propietarios';
  }

  obtenerEtiquetaCrearPersonas(): string {
    return 'Crear Propietario';
  }

  filtrarPromocionesAgrupadas(data: any[]): any[] {
    if (this.esCliente()) {
      const user = this.authService.getCurrentUser();
      const nombrePromotora = user?.nombrePromotora;
      if (nombrePromotora) {
        return data.filter(g => g.promotora.toLowerCase().trim() === nombrePromotora.toLowerCase().trim());
      }
    }
    return data;
  }
}
