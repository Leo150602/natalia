import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VisitasService } from '../../servicios/visitas-service';
import { EstadoGlobalService } from '../../servicios/global-service';
import { AlertaService } from '../../servicios/alerta-service';
import { VisitasRespuesta } from '../../modelos/visitas.model';
import { TablaDatosComponent } from '../../utils/tabla-datos/tabla-datos';
import { CONFIG_TABLA_VISITAS } from '../../modelos/columnas-config';

@Component({
  selector: 'app-visitas',
  standalone: true,
  imports: [CommonModule, TablaDatosComponent, FormsModule],
  templateUrl: './visitas.html',
  styleUrl: './visitas.scss'
})
export class VisitasComponent implements OnInit, OnDestroy {

  promocionId: number | null = null;
  datos: VisitasRespuesta[] = [];
  datosFiltrados: VisitasRespuesta[] = [];
  config = CONFIG_TABLA_VISITAS;
  private promoSub?: Subscription;

  // Filtros reactivos locales
  filtros = {
    numeroIncidencia: '',
    piso: '',
    tecnico: '',
    estado: ''
  };

  constructor(
    private visitasService: VisitasService,
    private estadoGlobal: EstadoGlobalService,
    private alerta: AlertaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Al abrir el componente, obtener el valor actual inmediatamente
    this.promocionId = this.estadoGlobal.getPromocion();
    if (this.promocionId !== null) {
      this.cargarVisitas();
    }

    // Suscribirse a cambios futuros desvinculando al destruir
    this.promoSub = this.estadoGlobal.promocion$.subscribe((id) => {
      if (id !== null && id !== this.promocionId) {
        this.promocionId = id;
        this.cargarVisitas();
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

  cargarVisitas(): void {
    if (this.promocionId === null) return;
    this.visitasService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.datos = res;
        this.aplicarFiltros();
      },
      error: (err) => {
        console.error("Error al obtener visitas por promoción:", err);
      }
    });
  }

  aplicarFiltros(): void {
    this.datosFiltrados = this.datos.filter(row => {
      const matchInc = !this.filtros.numeroIncidencia || (row.numeroIncidencia && row.numeroIncidencia.toLowerCase().includes(this.filtros.numeroIncidencia.toLowerCase()));
      const matchPiso = !this.filtros.piso || (row.piso && row.piso.toLowerCase().includes(this.filtros.piso.toLowerCase()));
      const matchTec = !this.filtros.tecnico || (row.tecnicoNombre && row.tecnicoNombre.toLowerCase().includes(this.filtros.tecnico.toLowerCase()));
      const matchEst = !this.filtros.estado || (row.estadoVisita && row.estadoVisita.toLowerCase().includes(this.filtros.estado.toLowerCase()));
      return matchInc && matchPiso && matchTec && matchEst;
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      numeroIncidencia: '',
      piso: '',
      tecnico: '',
      estado: ''
    };
    this.aplicarFiltros();
  }

  editarVisita(row: any): void {
    this.router.navigate(['/importar-visitas'], { queryParams: { id: row.idVisita } });
  }

  eliminarVisita(row: any): void {
    this.alerta.confirmar(
      '¿Eliminar Visita?',
      `¿Está seguro de que desea eliminar esta visita técnica?`
    ).then((confirmado) => {
      if (confirmado) {
        this.visitasService.eliminar(row.idVisita).subscribe({
          next: () => {
            this.alerta.exito("Visita técnica eliminada con éxito.");
            this.cargarVisitas();
          },
          error: (err) => {
            this.alerta.error("Error al eliminar: " + (err.error || err.message));
          }
        });
      }
    });
  }
}
