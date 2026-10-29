import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { VisitasService } from '../../../servicios/visitas-service';
import { EstadoGlobalService } from '../../../servicios/global-service';
import { PromocionesService } from '../../../servicios/promociones-service';
import { AlertaService } from '../../../servicios/alerta-service';
import { VisitasRespuesta } from '../../../modelos/visitas.model';
import { PermisosService } from '../../../servicios/permisos.service';

@Component({
  selector: 'app-visitas-dia',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dia.html',
  styleUrl: './dia.scss'
})
export class VisitasDiaComponent implements OnInit, OnDestroy {
  fechaSeleccionada!: string; // YYYY-MM-DD
  fechaFormateada!: string; // DD/MM/YYYY
  visitas: VisitasRespuesta[] = [];
  cargando = false;
  mapaColoresPromociones = new Map<string, string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private visitasService: VisitasService,
    private promocionesService: PromocionesService,
    private alerta: AlertaService,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const fechaParam = this.route.snapshot.paramMap.get('fecha');
    if (!fechaParam) {
      this.router.navigate(['/visitas/calendario']);
      return;
    }
    
    this.fechaSeleccionada = fechaParam;
    
    // Formatear fecha para mostrar
    const parts = fechaParam.split('-');
    if (parts.length === 3) {
      this.fechaFormateada = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
      this.fechaFormateada = fechaParam;
    }

    this.cargarDatos();
  }

  ngOnDestroy(): void {}

  cargarDatos(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    
    this.promocionesService.obtenerTodas().subscribe({
      next: (promos) => {
        this.mapaColoresPromociones.clear();
        (promos || []).forEach(group => {
          if (group.promocion) {
            group.promocion.forEach(p => {
              if (p.nombre && p.color) {
                this.mapaColoresPromociones.set(p.nombre.toUpperCase().trim(), p.color);
              }
            });
          }
        });
        
        this.cargarVisitas();
      },
      error: (err) => {
        console.error("Error al cargar promociones:", err);
        this.cargarVisitas();
      }
    });
  }

  cargarVisitas(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    this.visitasService.obtenerTodas().subscribe({
      next: (res: VisitasRespuesta[]) => {
        // Filtrar por fecha
        this.visitas = (res || []).filter((v: VisitasRespuesta) => {
          if (!v.diaVisita) return false;
          const dateStr = typeof v.diaVisita === 'string' ? v.diaVisita : (v.diaVisita as Date).toISOString();
          return dateStr.startsWith(this.fechaSeleccionada);
        });
        
        // Ordenar por hora
        this.visitas.sort((a: VisitasRespuesta, b: VisitasRespuesta) => {
          const t1 = a.diaVisita ? new Date(a.diaVisita).getTime() : 0;
          const t2 = b.diaVisita ? new Date(b.diaVisita).getTime() : 0;
          return t1 - t2;
        });

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error("Error al cargar visitas por día:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  obtenerColorVisita(v: VisitasRespuesta): string {
    if (v.promocion) {
      const color = this.mapaColoresPromociones.get(v.promocion.toUpperCase().trim());
      if (color) return color;
    }
    return '#a27b5c'; // color predeterminado
  }

  volverAlCalendario(): void {
    this.router.navigate(['/visitas/calendario']);
  }

  editarVisita(visita: VisitasRespuesta): void {
    this.router.navigate([`/visitas/detalle/${visita.idVisita}`], { queryParams: { origen: 'calendario' } });
  }

  eliminarVisita(visita: VisitasRespuesta): void {
    this.alerta.confirmar(
      '¿Eliminar Visita?',
      `¿Está seguro de que desea eliminar la visita técnica de las ${this.obtenerHoraFormateada(visita.diaVisita)}?`
    ).then((confirmado: boolean) => {
      if (confirmado) {
        this.cargando = true;
        this.cdr.detectChanges();
        this.visitasService.eliminar(visita.idVisita).subscribe({
          next: () => {
            this.alerta.exito("Visita técnica eliminada con éxito.");
            this.cargarVisitas();
          },
          error: (err: any) => {
            this.cargando = false;
            this.alerta.error("Error al eliminar: " + (err.error || err.message));
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  obtenerHoraFormateada(dia: string | Date): string {
    if (!dia) return '';
    try {
      const date = new Date(dia);
      if (!isNaN(date.getTime())) {
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');
        return `${horas}:${minutos}`;
      }
    } catch (e) {}
    return '';
  }
}
