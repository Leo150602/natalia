import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { EstadoGlobalService } from '../../servicios/global-service';

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
export class Sidebar implements OnInit {

  constructor(
    private estadoGlobalService: EstadoGlobalService,
    private cdr: ChangeDetectorRef
  ) {}

  promocionSeleccionada: number | null = null;

  secciones: any[] = [
    {
      nombre: 'Reportes',
      abierta: true,
      hijos: [
        {
          nombre: 'Incidencias',
          link: '/incidencias',
          requierePromo: true
        },
        {
          nombre: 'Visitas',
          link: '/visitas',
          requierePromo: true
        },
        {
          nombre: 'Promociones',
          link: '/promociones',
          requierePromo: false
        },
        {
          nombre: 'Propietarios',
          link: '/personas',
          requierePromo: true
        },
        {
          nombre: 'Pisos',
          link: '/pisos',
          requierePromo: true
        }
      ]
    },
    {
      nombre: 'Crear Registros',
      abierta: true,
      hijos: [
        {
          nombre: 'Crear Incidencia',
          link: '/importar-incidencias',
          requierePromo: true
        },
        {
          nombre: 'Crear Piso',
          link: '/importar-pisos',
          requierePromo: true
        },
        {
          nombre: 'Crear Visita',
          link: '/importar-visitas',
          requierePromo: true
        },
        {
          nombre: 'Crear Promoción',
          link: '/importar-promociones',
          requierePromo: false
        },
        {
          nombre: 'Crear Persona',
          link: '/importar-personas',
          requierePromo: false
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.estadoGlobalService.promocion$.subscribe((promoId) => {
      this.promocionSeleccionada = promoId;
      this.cdr.detectChanges(); // Forzar la detección de cambios en la vista
    });
  }

  cambiarEstado(seccion: any) {
    seccion.abierta = !seccion.abierta;
  }
}
