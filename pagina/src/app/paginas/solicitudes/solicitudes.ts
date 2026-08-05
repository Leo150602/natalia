import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SolicitudesService } from '../../servicios/solicitudes-service';
import { EstadoGlobalService } from '../../servicios/global-service';
import { AlertaService } from '../../servicios/alerta-service';
import { IncidenciasRespuesta } from '../../modelos/incidencias.model';
import { TablaDatosComponent, ColumnaTabla } from '../../utils/tabla-datos/tabla-datos';
import { PermisosService } from '../../servicios/permisos.service';

export interface ConfiguracionTabla {
  idCampo: string;
  idNombre: string;
  mostrarId: boolean;
  columnas: ColumnaTabla[];
}

export const CONFIG_TABLA_SOLICITUDES: ConfiguracionTabla = {
  idCampo: 'numeroIncidencia',
  idNombre: 'Nº Incidencia',
  mostrarId: true,
  columnas: [
    { campo: 'pisos.piso', nombre: 'Piso' },
    { campo: 'categoria', nombre: 'Categoría' },
    { campo: 'descripcion', nombre: 'Descripción' },
    { campo: 'horas', nombre: 'Horas Trabajadas' },
    { campo: 'materialesRequeridos', nombre: 'Materiales Requeridos' },
    { campo: 'solicitante', nombre: 'Solicitante' }
  ]
};

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, TablaDatosComponent, FormsModule],
  templateUrl: './solicitudes.html'
})
export class SolicitudesComponent implements OnInit, OnDestroy {

  promocionId: number | null = null;
  datos: IncidenciasRespuesta[] = [];
  config = CONFIG_TABLA_SOLICITUDES;
  cargando = false;
  private promoSub?: Subscription;

  constructor(
    private solicitudesService: SolicitudesService,
    private estadoGlobal: EstadoGlobalService,
    private alerta: AlertaService,
    private router: Router,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeVerSolicitudes()) {
      this.router.navigate(['/']);
      return;
    }

    this.promocionId = this.estadoGlobal.getPromocion();
    if (this.promocionId !== null) {
      this.cargarSolicitudes();
    }

    this.promoSub = this.estadoGlobal.promocion$.subscribe((id) => {
      if (id !== null && id !== this.promocionId) {
        this.promocionId = id;
        this.cargarSolicitudes();
      } else if (id === null) {
        this.promocionId = null;
        this.datos = [];
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.promoSub) {
      this.promoSub.unsubscribe();
    }
  }

  cargarSolicitudes(): void {
    if (this.promocionId === null) return;
    this.cargando = true;
    this.cdr.detectChanges();
    this.solicitudesService.obtenerSolicitudes(this.promocionId).subscribe({
      next: (res) => {
        this.datos = res;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al obtener solicitudes:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionados: any[] = [];

  onSeleccionCambiada(items: any[]): void {
    this.seleccionados = items;
  }

  aceptarSolicitud(row: any): void {
    this.alerta.confirmar(
      "¿Aceptar solicitud?",
      `¿Está seguro de aceptar la solicitud ${row.numeroIncidencia} y establecer su estado en "No visitado"?`,
      "Sí, aceptar"
    ).then((confirmed) => {
      if (confirmed) {
        this.cargando = true;
        this.cdr.detectChanges();
        this.solicitudesService.aceptarSolicitud(row.idIncidencia).subscribe({
          next: () => {
            this.alerta.exito("Solicitud aceptada correctamente.");
            this.cargarSolicitudes();
          },
          error: (err) => {
            console.error("Error al aceptar solicitud:", err);
            this.alerta.error("Error al aceptar solicitud: " + (err.error || err.message));
            this.cargando = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  rechazarSolicitud(row: any): void {
    this.alerta.confirmar(
      "¿Rechazar solicitud?",
      `¿Está seguro de rechazar la solicitud ${row.numeroIncidencia}?`,
      "Sí, rechazar"
    ).then((confirmed) => {
      if (confirmed) {
        this.cargando = true;
        this.cdr.detectChanges();
        this.solicitudesService.rechazarSolicitud(row.idIncidencia).subscribe({
          next: () => {
            this.alerta.exito("Solicitud rechazada correctamente.");
            this.cargarSolicitudes();
          },
          error: (err) => {
            console.error("Error al rechazar solicitud:", err);
            this.alerta.error("Error al rechazar solicitud: " + (err.error || err.message));
            this.cargando = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  aceptarMarcadas(): void {
    if (this.seleccionados.length === 0) return;
    const ids = this.seleccionados.map(item => item.idIncidencia);
    this.alerta.confirmar(
      "¿Aceptar solicitudes seleccionadas?",
      `¿Está seguro de aceptar las ${this.seleccionados.length} solicitudes marcadas y establecerlas como "No visitadas"?`,
      "Sí, aceptar todas"
    ).then((confirmed) => {
      if (confirmed) {
        this.cargando = true;
        this.cdr.detectChanges();
        this.solicitudesService.aceptarMultiples(ids).subscribe({
          next: () => {
            this.alerta.exito("Solicitudes aceptadas correctamente.");
            this.seleccionados = [];
            this.cargarSolicitudes();
          },
          error: (err) => {
            console.error("Error al aceptar múltiples solicitudes:", err);
            this.alerta.error("Error al aceptar múltiples solicitudes: " + (err.error || err.message));
            this.cargando = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  rechazarMarcadas(): void {
    if (this.seleccionados.length === 0) return;
    const ids = this.seleccionados.map(item => item.idIncidencia);
    this.alerta.confirmar(
      "¿Rechazar solicitudes seleccionadas?",
      `¿Está seguro de rechazar las ${this.seleccionados.length} solicitudes marcadas?`,
      "Sí, rechazar todas"
    ).then((confirmed) => {
      if (confirmed) {
        this.cargando = true;
        this.cdr.detectChanges();
        this.solicitudesService.rechazarMultiples(ids).subscribe({
          next: () => {
            this.alerta.exito("Solicitudes rechazadas correctamente.");
            this.seleccionados = [];
            this.cargarSolicitudes();
          },
          error: (err) => {
            console.error("Error al rechazar múltiples solicitudes:", err);
            this.alerta.error("Error al rechazar múltiples solicitudes: " + (err.error || err.message));
            this.cargando = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
}
