import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EstadoGlobalService } from '../../servicios/global-service';
import { IncidenciasService } from '../../servicios/incidencias-service';
import { PromocionesService } from '../../servicios/promociones-service';
import { EnumService } from '../../servicios/enum-service';
import { AlertaService } from '../../servicios/alerta-service';
import { IncidenciasRespuesta, IncidenciasFiltroDto } from '../../modelos/incidencias.model';
import { TablaDatosComponent } from '../../utils/tabla-datos/tabla-datos';
import { CONFIG_TABLA_INCIDENCIAS } from '../../modelos/columnas-config';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, TablaDatosComponent, FormsModule],
  templateUrl: './incidencias.html',
  styleUrl: './incidencias.scss'
})
export class IncidenciasComponent implements OnInit, OnDestroy {

  promocionId: number | null = null;
  promocionNombre: string | null = null;
  promotoraNombre: string | null = null;
  datos: IncidenciasRespuesta[] = [];
  config = CONFIG_TABLA_INCIDENCIAS;
  private promoSub?: Subscription;

  // Control del Menú Flotante de Filtros
  mostrarMenuFiltros = false;

  // Filtros
  filtros: any = {
    numeroIncidencia: '',
    piso: '',
    fechaInicial: '',
    fechaFinal: '',
    estadoIncidencia: '',
    categoriaIncidencia: ''
  };

  // Opciones de Enums
  categorias: any[] = [];
  estados: any[] = [];

  constructor(
    private estadoGlobal: EstadoGlobalService,
    private incidenciasService: IncidenciasService,
    private promocionesService: PromocionesService,
    private enumService: EnumService,
    private alerta: AlertaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Al abrir el componente, obtener el valor actual inmediatamente
    this.promocionId = this.estadoGlobal.getPromocion();
    if (this.promocionId !== null) {
      this.cargarPromocionInfo(this.promocionId);
    }

    // Suscribirse a cambios futuros desvinculando al destruir
    this.promoSub = this.estadoGlobal.promocion$.subscribe((id) => {
      if (id !== null && id !== this.promocionId) {
        this.promocionId = id;
        this.cargarPromocionInfo(id);
      } else if (id === null) {
        this.promocionId = null;
        this.promocionNombre = null;
        this.promotoraNombre = null;
        this.datos = [];
        this.cdr.detectChanges();
      }
    });

    this.cargarEnums();
  }

  ngOnDestroy(): void {
    if (this.promoSub) {
      this.promoSub.unsubscribe();
    }
  }

  cargarPromocionInfo(id: number): void {
    this.promocionesService.obtenerPorId(id).subscribe({
      next: (res) => {
        this.promocionNombre = res.promocion && res.promocion.length > 0 ? res.promocion[0].nombre : null;
        this.promotoraNombre = res.promotora || null;
        this.cargarIncidencias();
      },
      error: (err) => {
        console.error("Error al obtener información de la promoción:", err);
        this.cargarIncidencias();
      }
    });
  }

  cargarIncidencias(): void {
    if (this.promocionId === null) return;
    this.incidenciasService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.datos = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al obtener incidencias:", err);
      }
    });
  }

  cargarEnums(): void {
    this.enumService.obtenerTodosLosEnums().subscribe({
      next: (res) => {
        this.categorias = res.categorias || [];
        this.estados = res.estadosIncidencia || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar enums:", err)
    });
  }

  toggleMenuFiltros(): void {
    this.mostrarMenuFiltros = !this.mostrarMenuFiltros;
  }

  aplicarFiltros(): void {
    let fechaIni = null;
    if (this.filtros.fechaInicial) {
      fechaIni = new Date(this.filtros.fechaInicial).toISOString().split('.')[0];
    }
    let fechaFin = null;
    if (this.filtros.fechaFinal) {
      fechaFin = new Date(this.filtros.fechaFinal).toISOString().split('.')[0];
    }

    const dto: IncidenciasFiltroDto = {
      numeroIncidencia: this.filtros.numeroIncidencia || null,
      piso: this.filtros.piso || null,
      promocion: this.promocionNombre, // Forzar filtrado a la promoción activa
      fechaInicial: fechaIni,
      fechaFinal: fechaFin,
      estadoIncidencia: this.filtros.estadoIncidencia || null,
      categoriaIncidencia: this.filtros.categoriaIncidencia || null
    };

    this.incidenciasService.filtrar(dto).subscribe({
      next: (res) => {
        this.datos = res;
        this.mostrarMenuFiltros = false; // Cerrar el menú flotante al aplicar
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.alerta.error("Error al aplicar filtros: " + (err.error || err.message));
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      numeroIncidencia: '',
      piso: '',
      fechaInicial: '',
      fechaFinal: '',
      estadoIncidencia: '',
      categoriaIncidencia: ''
    };
    this.mostrarMenuFiltros = false; // Cerrar
    this.cargarIncidencias();
  }

  editarIncidencia(row: any): void {
    this.router.navigate(['/importar-incidencias'], { queryParams: { id: row.numeroIncidencia } });
  }

  eliminarIncidencia(row: any): void {
    this.alerta.confirmar(
      '¿Eliminar Incidencia?',
      `¿Está seguro de que desea eliminar la incidencia "${row.numeroIncidencia}"?`
    ).then((confirmado) => {
      if (confirmado) {
        this.incidenciasService.eliminar(row.numeroIncidencia).subscribe({
          next: () => {
            this.alerta.exito("Incidencia eliminada con éxito.");
            this.cargarIncidencias();
          },
          error: (err) => {
            this.alerta.error("Error al eliminar: " + (err.error || err.message));
          }
        });
      }
    });
  }

  importarExcel(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.promocionId !== null) {
      this.incidenciasService.importar(file, this.promocionId).subscribe({
        next: (res) => {
          this.alerta.exito("Importación completada exitosamente.");
          this.cargarIncidencias();
        },
        error: (err) => {
          this.alerta.error("Error al importar: " + (err.error || err.message));
        }
      });
    }
  }

  exportarExcel(): void {
    if (this.promocionId === null) return;
    this.incidenciasService.exportar(this.promocionId).subscribe({
      next: (blob) => {
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const hoy = new Date();
        const dia = hoy.getDate();
        const mes = meses[hoy.getMonth()];
        const fechaStr = `${dia}_de_${mes}`;
        const promoLimpia = (this.promocionNombre || 'sin_promocion').toLowerCase().replace(/\s+/g, '_');

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `incidencias_${promoLimpia}_${fechaStr}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.alerta.error("Error al exportar: " + err.message);
      }
    });
  }
}
