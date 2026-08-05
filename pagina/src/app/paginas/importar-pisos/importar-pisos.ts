import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EstadoGlobalService } from '../../servicios/global-service';
import { PisosService } from '../../servicios/pisos-service';
import { PersonasService } from '../../servicios/personas-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PermisosService } from '../../servicios/permisos.service';
import { PisosDto } from '../../modelos/pisos.model';
import { PersonasRespuesta } from '../../modelos/personas.model';

@Component({
  selector: 'app-importar-pisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importar-pisos.html',
  styleUrl: './importar-pisos.scss'
})
export class ImportarPisosComponent implements OnInit {

  promocionId: number | null = null;
  cargando = false;

  modoEdicion = false;
  idPisoEdicion: number | null = null;

  nuevoPiso: any = {
    piso: '',
    idPropietario: null
  };

  propietarios: PersonasRespuesta[] = [];

  constructor(
    private globalService: EstadoGlobalService,
    private pisosService: PisosService,
    private personasService: PersonasService,
    private alerta: AlertaService,
    private router: Router,
    private route: ActivatedRoute,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeInsertarEditarPisosYPropietarios()) {
      this.router.navigate(['/pisos']);
      return;
    }

    this.globalService.promocion$.subscribe((id) => {
      this.promocionId = id;
      if (id !== null) {
        this.cargarPropietarios();
      }
    });

    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.modoEdicion = true;
      this.idPisoEdicion = Number(id);
    }
  }

  cargarPropietarios(): void {
    if (this.promocionId === null) return;
    this.personasService.obtenerPropietariosPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.propietarios = res;
        this.cdr.detectChanges();
        if (this.modoEdicion) {
          this.cargarDatosPisoEdicion();
        }
      },
      error: (err) => console.error("Error al cargar propietarios:", err)
    });
  }

  cargarDatosPisoEdicion(): void {
    if (this.idPisoEdicion === null) return;
    this.pisosService.obtenerPorId(this.idPisoEdicion).subscribe({
      next: (res) => {
        this.nuevoPiso = {
          piso: res.piso,
          idPropietario: res.idPropietario || null
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar piso para edición:", err)
    });
  }

  guardar(): void {
    if (this.promocionId === null) {
      this.alerta.advertencia("No hay una promoción seleccionada.");
      return;
    }
    if (!this.nuevoPiso.piso) {
      this.alerta.advertencia("Por favor ingrese la identificación del piso.");
      return;
    }

    this.cargando = true;

    const dto: PisosDto = {
      piso: this.nuevoPiso.piso,
      idPromocion: this.promocionId,
      idPropietario: this.nuevoPiso.idPropietario || null
    };

    const operacion = this.modoEdicion && this.idPisoEdicion !== null
      ? this.pisosService.actualizar(this.idPisoEdicion, dto)
      : this.pisosService.insertar(dto);

    operacion.subscribe({
      next: () => {
        this.cargando = false;
        this.alerta.exito(this.modoEdicion ? "Piso actualizado con éxito." : "Piso registrado con éxito.");
        this.router.navigate(['/pisos']);
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al guardar piso: " + (err.error || err.message));
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/pisos']);
  }
}
