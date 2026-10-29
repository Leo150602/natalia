import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
import { PermisosService } from '../../servicios/permisos.service';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, TablaDatosComponent, FormsModule, RouterLink],
  templateUrl: './incidencias.html',
  styleUrl: './incidencias.scss'
})
export class IncidenciasComponent implements OnInit, OnDestroy {

  promocionId: number | null = null;
  promocionNombre: string | null = null;
  promotoraNombre: string | null = null;
  datos: IncidenciasRespuesta[] = [];
  config = CONFIG_TABLA_INCIDENCIAS;
  cargando = false;
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

  // Exportación con Filtros y Switches
  mostrarModalExportar = false;
  habilitarFiltroNumero = false;
  habilitarFiltroPiso = false;
  habilitarFiltroCategoria = false;
  habilitarFiltroEstado = false;
  habilitarFiltroFechas = false;
  filtrosExportar = {
    numeroIncidencia: '',
    piso: '',
    categoriaIncidencia: '',
    estadoIncidencia: '',
    fechaInicial: '',
    fechaFinal: ''
  };

  constructor(
    private estadoGlobal: EstadoGlobalService,
    private incidenciasService: IncidenciasService,
    private promocionesService: PromocionesService,
    private enumService: EnumService,
    private alerta: AlertaService,
    private router: Router,
    public permisosService: PermisosService,
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
    this.cargando = true;
    this.cdr.detectChanges();
    this.incidenciasService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.datos = res;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al obtener incidencias:", err);
        this.cargando = false;
        this.cdr.detectChanges();
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
    this.cdr.detectChanges();
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
    this.router.navigate(['/importar-incidencias'], { queryParams: { id: row.idIncidencia } });
  }

  irAlDetalle(row: any): void {
    this.router.navigate(['/incidencias/detalle', row.idIncidencia]);
  }

  eliminarIncidencia(row: any): void {
    this.alerta.confirmar(
      '¿Eliminar Incidencia?',
      `¿Está seguro de que desea eliminar la incidencia "${row.numeroIncidencia}"?`
    ).then((confirmado) => {
      if (confirmado) {
        this.incidenciasService.eliminar(row.idIncidencia).subscribe({
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
    this.abrirModalExportar();
  }

  abrirModalExportar(): void {
    this.mostrarModalExportar = true;
    this.habilitarFiltroNumero = false;
    this.habilitarFiltroPiso = false;
    this.habilitarFiltroCategoria = false;
    this.habilitarFiltroEstado = false;
    this.habilitarFiltroFechas = false;
    this.filtrosExportar = {
      numeroIncidencia: '',
      piso: '',
      categoriaIncidencia: '',
      estadoIncidencia: '',
      fechaInicial: '',
      fechaFinal: ''
    };
    this.cdr.detectChanges();
  }

  cerrarModalExportar(): void {
    this.mostrarModalExportar = false;
    this.cdr.detectChanges();
  }

  ejecutarExportacionConFiltros(): void {
    if (this.promocionId === null) return;
    
    // Compilar los filtros activos
    const reqFiltros: any = {};
    if (this.habilitarFiltroNumero && this.filtrosExportar.numeroIncidencia) {
      reqFiltros.numeroIncidencia = this.filtrosExportar.numeroIncidencia.trim();
    }
    if (this.habilitarFiltroPiso && this.filtrosExportar.piso) {
      reqFiltros.piso = this.filtrosExportar.piso.trim();
    }
    if (this.habilitarFiltroCategoria && this.filtrosExportar.categoriaIncidencia) {
      reqFiltros.categoriaIncidencia = this.filtrosExportar.categoriaIncidencia;
    }
    if (this.habilitarFiltroEstado && this.filtrosExportar.estadoIncidencia) {
      reqFiltros.estadoIncidencia = this.filtrosExportar.estadoIncidencia;
    }
    if (this.habilitarFiltroFechas) {
      if (this.filtrosExportar.fechaInicial) {
        reqFiltros.fechaInicial = new Date(this.filtrosExportar.fechaInicial).toISOString().split('.')[0];
      }
      if (this.filtrosExportar.fechaFinal) {
        reqFiltros.fechaFinal = new Date(this.filtrosExportar.fechaFinal).toISOString().split('.')[0];
      }
    }

    this.mostrarModalExportar = false;
    this.cdr.detectChanges();

    this.incidenciasService.exportar(this.promocionId, reqFiltros).subscribe({
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
        a.download = `incidencias_filtradas_${promoLimpia}_${fechaStr}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        const parseAndConfirm = (msg: string) => {
          if (msg.includes("No se encontraron registros")) {
            this.alerta.confirmar(
              "Reporte Vacío",
              "El documento exportado no tiene registros, ¿aún quiere descargarlo?",
              "Sí, descargar"
            ).then((confirmado) => {
              if (confirmado) {
                this.descargarVacioForzado(reqFiltros);
              }
            });
          } else {
            this.alerta.error("Error al exportar: " + msg);
          }
        };

        if (err.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            parseAndConfirm(e.target.result || "");
          };
          reader.readAsText(err.error);
        } else {
          parseAndConfirm(err.error || err.message || "");
        }
      }
    });
  }

  descargarVacioForzado(reqFiltros: any): void {
    if (this.promocionId === null) return;
    this.incidenciasService.exportar(this.promocionId, reqFiltros, true).subscribe({
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
        a.download = `incidencias_filtradas_vacias_${promoLimpia}_${fechaStr}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.alerta.error("No se pudo descargar el reporte vacío: " + err.message);
      }
    });
  }
}
