import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PromocionesService } from '../../servicios/promociones-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PromocionesDto } from '../../modelos/promociones.model';
import { PermisosService } from '../../servicios/permisos.service';

@Component({
  selector: 'app-importar-promociones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importar-promociones.html',
  styleUrl: './importar-promociones.scss'
})
export class ImportarPromocionesComponent implements OnInit {

  cargando = false;

  modoEdicion = false;
  idPromocionEdicion: number | null = null;

  nuevaPromo: any = {
    promotora: '',
    promocion: '',
    direccion: ''
  };

  constructor(
    private promocionesService: PromocionesService,
    private alerta: AlertaService,
    private router: Router,
    private route: ActivatedRoute,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeVerPromociones() || !this.permisosService.puedeInsertarEditar()) {
      this.router.navigate(['/promociones']);
      return;
    }

    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.modoEdicion = true;
      this.idPromocionEdicion = Number(id);
      this.cargarDatosPromocionEdicion();
    }
  }

  cargarDatosPromocionEdicion(): void {
    if (this.idPromocionEdicion === null) return;
    this.promocionesService.obtenerPorId(this.idPromocionEdicion).subscribe({
      next: (res) => {
        this.nuevaPromo = {
          promocion: res.promocion && res.promocion.length > 0 ? res.promocion[0].nombre : '',
          promotora: res.promotora,
          direccion: res.promocion && res.promocion.length > 0 ? (res.promocion[0].direccion || '') : ''
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar promoción para edición:", err)
    });
  }

  guardar(): void {
    if (!this.nuevaPromo.promotora || !this.nuevaPromo.promocion) {
      this.alerta.advertencia("Por favor rellene todos los campos (Promotora y Promoción).");
      return;
    }

    this.cargando = true;

    const dto: PromocionesDto = {
      promotora: this.nuevaPromo.promotora.toUpperCase(),
      promocion: this.nuevaPromo.promocion.toUpperCase(),
      direccion: this.nuevaPromo.direccion
    };

    const operacion = this.modoEdicion && this.idPromocionEdicion !== null
      ? this.promocionesService.actualizar(this.idPromocionEdicion, dto)
      : this.promocionesService.insertar(dto);

    operacion.subscribe({
      next: () => {
        this.cargando = false;
        this.alerta.exito(this.modoEdicion ? "Promoción actualizada con éxito." : "Promoción registrada con éxito.");
        this.router.navigate(['/promociones']);
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al guardar promoción: " + (err.error || err.message));
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/promociones']);
  }
}
