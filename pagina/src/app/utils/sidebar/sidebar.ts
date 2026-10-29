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
    
    if (this.permisosService.puedeVerSolicitudes()) {
      hijosReportes.push({ nombre: 'Solicitudes', link: '/solicitudes', requierePromo: true });
    }
    
    if (this.permisosService.puedeVerPisosYPropietarios()) {
      hijosReportes.push({ nombre: this.permisosService.obtenerEtiquetaPersonas(), link: '/personas', requierePromo: true });
      hijosReportes.push({ nombre: 'Pisos', link: '/pisos', requierePromo: true });
    }

    list.push({
      nombre: 'Reportes',
      abierta: false,
      hijos: hijosReportes
    });

    // 2. Sección de Planificación
    const hijosPlanificacion: any[] = [];
    hijosPlanificacion.push({ nombre: 'Visitas', link: '/visitas', requierePromo: true });
    hijosPlanificacion.push({ nombre: 'Calendario', link: '/visitas/calendario', requierePromo: false });

    list.push({
      nombre: 'Planificación',
      abierta: false,
      hijos: hijosPlanificacion
    });

    // 3. Sección Comercial
    const hijosComercial: any[] = [];
    hijosComercial.push({ nombre: 'Mapa de clientes', link: '/mapa-clientes', requierePromo: false });
    
    if (this.permisosService.puedeVerPromociones()) {
      hijosComercial.push({ nombre: 'Promociones', link: '/promociones', requierePromo: false });
    }
    
    if (this.permisosService.puedeAdministrarClientes()) {
      hijosComercial.push({ nombre: 'Clientes', link: '/clientes', requierePromo: false });
    }

    list.push({
      nombre: 'Comercial',
      abierta: false,
      hijos: hijosComercial
    });



    // 3. Sección de Administración
    if (this.permisosService.puedeVerMenuAdministracion()) {
      const hijosAdmin = [
        { nombre: 'Usuarios', link: '/usuarios', requierePromo: false }
      ];
      list.push({
        nombre: 'Administración',
        abierta: false,
        hijos: hijosAdmin
      });
    }

    // 4. Sección de Documentos
    if (this.permisosService.puedeVerPlantillas()) {
      list.push({
        nombre: 'Documentos',
        abierta: false,
        hijos: [
          { nombre: 'Plantillas', link: '/plantillas', requierePromo: false }
        ]
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
