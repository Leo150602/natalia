import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersonasService } from '../../servicios/personas-service';
import { EstadoGlobalService } from '../../servicios/global-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PersonasRespuesta } from '../../modelos/personas.model';
import { TablaDatosComponent } from '../../utils/tabla-datos/tabla-datos';
import { CONFIG_TABLA_PROPIETARIOS } from '../../modelos/columnas-config';
import { PermisosService } from '../../servicios/permisos.service';

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, TablaDatosComponent, FormsModule],
  templateUrl: './personas.html',
  styleUrl: './personas.scss'
})
export class PersonasComponent implements OnInit, OnDestroy {

  promocionId: number | null = null;
  datos: PersonasRespuesta[] = [];
  datosFiltrados: PersonasRespuesta[] = [];
  config = CONFIG_TABLA_PROPIETARIOS;
  cargando = false;
  private promoSub?: Subscription;

  // Filtros reactivos locales
  filtros = {
    nombre: '',
    telefono: ''
  };

  constructor(
    private personasService: PersonasService,
    private estadoGlobal: EstadoGlobalService,
    private alerta: AlertaService,
    private router: Router,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeVerPisosYPropietarios()) {
      this.router.navigate(['/']);
      return;
    }

    // Al abrir el componente, obtener el valor actual inmediatamente
    this.promocionId = this.estadoGlobal.getPromocion();
    if (this.promocionId !== null) {
      this.cargarPersonas();
    }

    // Suscribirse a cambios futuros desvinculando al destruir
    this.promoSub = this.estadoGlobal.promocion$.subscribe((id) => {
      if (id !== null && id !== this.promocionId) {
        this.promocionId = id;
        this.cargarPersonas();
      } else if (id === null) {
        this.promocionId = null;
        this.datos = [];
        this.datosFiltrados = [];
      }
    });
  }

  ngOnDestroy(): void {
    if (this.promoSub) {
      this.promoSub.unsubscribe();
    }
  }

  cargarPersonas(): void {
    if (this.promocionId === null) return;
    this.cargando = true;
    this.cdr.detectChanges();
    this.personasService.obtenerPropietariosPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.datos = res;
        this.cargando = false;
        this.aplicarFiltros();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al obtener propietarios por promoción:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  obtenerSubtitulo(): string {
    return 'Listado de propietarios asociados a la promoción';
  }

  aplicarFiltros(): void {
    this.datosFiltrados = this.datos.filter(row => {
      const matchNom = !this.filtros.nombre || (row.nombre && row.nombre.toLowerCase().includes(this.filtros.nombre.toLowerCase()));
      const matchTel = !this.filtros.telefono || (row.telefono && row.telefono.toLowerCase().includes(this.filtros.telefono.toLowerCase()));
      return matchNom && matchTel;
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      nombre: '',
      telefono: ''
    };
    this.aplicarFiltros();
  }

  editarPersona(row: any): void {
    this.router.navigate(['/importar-personas'], { queryParams: { id: row.idPersona } });
  }

  eliminarPersona(row: any): void {
    this.alerta.confirmar(
      '¿Eliminar Persona?',
      `¿Está seguro de que desea eliminar a "${row.nombre}"?`
    ).then((confirmado) => {
      if (confirmado) {
        this.personasService.eliminar(row.idPersona).subscribe({
          next: () => {
            this.alerta.exito("Persona eliminada con éxito.");
            this.cargarPersonas();
          },
          error: (err) => {
            this.alerta.error("Error al eliminar: " + (err.error || err.message));
          }
        });
      }
    });
  }
}
