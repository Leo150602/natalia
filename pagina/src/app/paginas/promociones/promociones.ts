import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PromocionesService } from '../../servicios/promociones-service';
import { AlertaService } from '../../servicios/alerta-service';
import { TablaDatosComponent } from '../../utils/tabla-datos/tabla-datos';
import { CONFIG_TABLA_PROMOCIONES } from '../../modelos/columnas-config';

@Component({
  selector: 'app-promociones',
  standalone: true,
  imports: [CommonModule, TablaDatosComponent, FormsModule],
  templateUrl: './promociones.html',
  styleUrl: './promociones.scss'
})
export class PromocionesComponent implements OnInit {

  datos: any[] = [];
  datosFiltrados: any[] = [];
  config = CONFIG_TABLA_PROMOCIONES;

  // Filtros reactivos locales
  filtros = {
    promocion: '',
    promotora: ''
  };

  constructor(
    private promocionesService: PromocionesService,
    private alerta: AlertaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPromociones();
  }

  cargarPromociones(): void {
    this.promocionesService.obtenerTodas().subscribe({
      next: (res) => {
        const flatList: any[] = [];
        res.forEach(group => {
          group.promocion.forEach(promo => {
            flatList.push({
              idPromocion: promo.idPromocion,
              promocion: promo.nombre,
              promotora: group.promotora
            });
          });
        });
        this.datos = flatList;
        this.aplicarFiltros();
      },
      error: (err) => {
        console.error("Error al obtener promociones:", err);
      }
    });
  }

  aplicarFiltros(): void {
    this.datosFiltrados = this.datos.filter(row => {
      const matchPromo = !this.filtros.promocion || (row.promocion && row.promocion.toLowerCase().includes(this.filtros.promocion.toLowerCase()));
      const matchPrmtr = !this.filtros.promotora || (row.promotora && row.promotora.toLowerCase().includes(this.filtros.promotora.toLowerCase()));
      return matchPromo && matchPrmtr;
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      promocion: '',
      promotora: ''
    };
    this.aplicarFiltros();
  }

  editarPromocion(row: any): void {
    this.router.navigate(['/importar-promociones'], { queryParams: { id: row.idPromocion } });
  }

  eliminarPromocion(row: any): void {
    this.alerta.confirmar(
      '¿Eliminar Promoción?',
      `¿Está seguro de que desea eliminar la promoción "${row.promocion}"?`
    ).then((confirmado) => {
      if (confirmado) {
        this.promocionesService.eliminar(row.idPromocion).subscribe({
          next: () => {
            this.alerta.exito("Promoción eliminada con éxito.");
            this.cargarPromociones();
          },
          error: (err) => {
            this.alerta.error("Error al eliminar: " + (err.error || err.message));
          }
        });
      }
    });
  }
}
