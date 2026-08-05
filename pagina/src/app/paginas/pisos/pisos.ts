import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EstadoGlobalService } from '../../servicios/global-service';
import { PisosService } from '../../servicios/pisos-service';
import { PromocionesService } from '../../servicios/promociones-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PisosRespuesta } from '../../modelos/pisos.model';
import { TablaDatosComponent } from '../../utils/tabla-datos/tabla-datos';
import { CONFIG_TABLA_PISOS } from '../../modelos/columnas-config';
import { PermisosService } from '../../servicios/permisos.service';

@Component({
  selector: 'app-pisos',
  standalone: true,
  imports: [CommonModule, TablaDatosComponent, FormsModule],
  templateUrl: './pisos.html',
  styleUrl: './pisos.scss'
})
export class PisosComponent implements OnInit, OnDestroy {

  promocionId: number | null = null;
  promocionNombre: string | null = null;
  datos: PisosRespuesta[] = [];
  datosFiltrados: PisosRespuesta[] = [];
  config = CONFIG_TABLA_PISOS;
  cargando = false;
  private promoSub?: Subscription;

  // Filtros reactivos locales
  filtros = {
    piso: '',
    propietario: '',
    telefono: ''
  };

  constructor(
    private estadoGlobal: EstadoGlobalService,
    private pisosService: PisosService,
    private promocionesService: PromocionesService,
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
      this.cargarPisos();
    }

    // Suscribirse a cambios futuros desvinculando la anterior al destruir
    this.promoSub = this.estadoGlobal.promocion$.subscribe((id) => {
      if (id !== null && id !== this.promocionId) {
        this.promocionId = id;
        this.cargarPisos();
      } else if (id === null) {
        this.promocionId = null;
        this.promocionNombre = null;
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

  cargarPisos(): void {
    if (this.promocionId === null) return;
    this.cargando = true;
    this.cdr.detectChanges();
    this.pisosService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.datos = res;
        this.cargando = false;
        this.aplicarFiltros();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al obtener pisos:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });

    // Obtener el nombre de la promoción para armar el nombre del archivo
    this.promocionesService.obtenerPorId(this.promocionId).subscribe({
      next: (res) => {
        this.promocionNombre = res.promocion && res.promocion.length > 0 ? res.promocion[0].nombre : null;
      },
      error: (err) => console.error("Error al obtener información de la promoción:", err)
    });
  }

  aplicarFiltros(): void {
    this.datosFiltrados = this.datos.filter(row => {
      const matchPiso = !this.filtros.piso || row.piso.toLowerCase().includes(this.filtros.piso.toLowerCase());
      const matchProp = !this.filtros.propietario || (row.propietario && row.propietario.toLowerCase().includes(this.filtros.propietario.toLowerCase()));
      const matchTel = !this.filtros.telefono || (row.telefonoPropietario && row.telefonoPropietario.toLowerCase().includes(this.filtros.telefono.toLowerCase()));
      return matchPiso && matchProp && matchTel;
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      piso: '',
      propietario: '',
      telefono: ''
    };
    this.aplicarFiltros();
  }

  editarPiso(row: any): void {
    this.router.navigate(['/importar-pisos'], { queryParams: { id: row.idPiso } });
  }

  eliminarPiso(row: any): void {
    this.alerta.confirmar(
      '¿Eliminar Piso?',
      `¿Está seguro de que desea eliminar el piso "${row.piso}"?`
    ).then((confirmado) => {
      if (confirmado) {
        this.pisosService.eliminar(row.idPiso).subscribe({
          next: () => {
            this.alerta.exito("Piso eliminado con éxito.");
            this.cargarPisos();
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
      this.pisosService.importar(file, this.promocionId).subscribe({
        next: (res) => {
          this.alerta.exito("Importación de pisos completada exitosamente.");
          this.cargarPisos();
        },
        error: (err) => {
          this.alerta.error("Error al importar: " + (err.error || err.message));
        }
      });
    }
  }

  exportarExcel(): void {
    if (this.promocionId === null) return;
    this.pisosService.exportar(this.promocionId).subscribe({
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
        a.download = `pisos_${promoLimpia}_${fechaStr}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.alerta.error("Error al exportar: " + err.message);
      }
    });
  }
}
