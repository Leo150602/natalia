import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { EstadoGlobalService } from '../../servicios/global-service';
import { AuthService } from '../../servicios/auth-service';
import { PermisosService } from '../../servicios/permisos.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit, OnDestroy {
  private userSub?: Subscription;

  constructor(
    private estadoGlobalService: EstadoGlobalService,
    private authService: AuthService,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  promocionSeleccionada: number | null = null;
  secciones: any[] = [];

  ngOnInit(): void {
    this.estadoGlobalService.promocion$.subscribe((promoId) => {
      this.promocionSeleccionada = promoId;
      this.cdr.detectChanges(); 
    });

    this.userSub = this.authService.currentUser$.subscribe((user) => {
      this.rebuildMenu();
      this.cdr.detectChanges();
    });
  }

  rebuildMenu(): void {
    const list: any[] = [];

    // 1. Sección de Reportes
    const hijosReportes: any[] = [];
    hijosReportes.push({ nombre: 'Incidencias', link: '/incidencias', requierePromo: true });
    hijosReportes.push({ nombre: 'Visitas', link: '/visitas', requierePromo: true });
    
    if (this.permisosService.puedeVerSolicitudes()) {
      hijosReportes.push({ nombre: 'Solicitudes', link: '/solicitudes', requierePromo: true });
    }
    
    if (this.permisosService.puedeVerPromociones()) {
      hijosReportes.push({ nombre: 'Promociones', link: '/promociones', requierePromo: false });
    }
    
    if (this.permisosService.puedeVerPisosYPropietarios()) {
      hijosReportes.push({ nombre: this.permisosService.obtenerEtiquetaPersonas(), link: '/personas', requierePromo: true });
      hijosReportes.push({ nombre: 'Pisos', link: '/pisos', requierePromo: true });
    }

    if (this.permisosService.puedeAdministrarClientes()) {
      hijosReportes.push({ nombre: 'Clientes', link: '/clientes', requierePromo: false });
    }

    list.push({
      nombre: 'Reportes',
      abierta: true,
      hijos: hijosReportes
    });

    // 2. Sección de Crear Registros
    const hijosCrear: any[] = [];
    
    if (this.permisosService.puedeInsertarEditar()) {
      hijosCrear.push({ nombre: 'Crear Incidencia', link: '/importar-incidencias', requierePromo: true });
      hijosCrear.push({ nombre: 'Crear Visita', link: '/importar-visitas', requierePromo: true });
      hijosCrear.push({ nombre: 'Crear Piso', link: '/importar-pisos', requierePromo: true });
      hijosCrear.push({ nombre: this.permisosService.obtenerEtiquetaCrearPersonas(), link: '/importar-personas', requierePromo: false });
      if (this.permisosService.puedeVerPromociones()) {
        hijosCrear.push({ nombre: 'Crear Promoción', link: '/importar-promociones', requierePromo: false });
      }
      if (this.permisosService.puedeAdministrarClientes()) {
        hijosCrear.push({ nombre: 'Crear Cliente', link: '/importar-clientes', requierePromo: false });
      }
    } else {
      hijosCrear.push({ nombre: 'Solicitar Incidencia', link: '/importar-incidencias', requierePromo: true });
    }

    if (hijosCrear.length > 0) {
      list.push({
        nombre: 'Crear Registros',
        abierta: true,
        hijos: hijosCrear
      });
    }

    // 3. Sección de Administración
    if (this.permisosService.puedeVerMenuAdministracion()) {
      const hijosAdmin = [
        { nombre: 'Usuarios', link: '/usuarios', requierePromo: false }
      ];
      if (this.permisosService.puedeRegistrarUsuarios()) {
        hijosAdmin.push({ nombre: 'Registrar Usuario', link: '/registro-usuarios', requierePromo: false });
      }
      list.push({
        nombre: 'Administración',
        abierta: true,
        hijos: hijosAdmin
      });
    }

    this.secciones = list;
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  cambiarEstado(seccion: any) {
    seccion.abierta = !seccion.abierta;
  }
}
