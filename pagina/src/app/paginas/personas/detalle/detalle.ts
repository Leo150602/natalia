import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PersonasService } from '../../../servicios/personas-service';
import { AlertaService } from '../../../servicios/alerta-service';
import { PermisosService } from '../../../servicios/permisos.service';
import { PersonasDto } from '../../../modelos/personas.model';

@Component({
  selector: 'app-detalle-persona',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss'
})
export class DetallePersonaComponent implements OnInit {

  idPersona!: number;
  cargando = false;
  puedeEditar = false;
  modoCrear = false;

  persona: any = {
    nombre: '',
    telefono: '',
    tipoPersonas: 'PROPIETARIO'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personasService: PersonasService,
    private alerta: AlertaService,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/personas']);
      return;
    }

    this.puedeEditar = this.permisosService.puedeInsertarEditarPisosYPropietarios();

    if (idParam === 'nuevo') {
      this.modoCrear = true;
      this.persona = {
        nombre: '',
        telefono: '',
        tipoPersonas: 'PROPIETARIO'
      };
    } else {
      this.idPersona = Number(idParam);
      this.cargarDatosPersona();
    }
  }

  cargarDatosPersona(): void {
    this.cargando = true;
    this.personasService.obtenerPorId(this.idPersona).subscribe({
      next: (res) => {
        this.persona = {
          nombre: res.nombre,
          telefono: res.telefono,
          tipoPersonas: 'PROPIETARIO'
        };
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar persona:", err);
        this.cargando = false;
        this.alerta.error("No se pudo cargar la información del propietario.");
        this.router.navigate(['/personas']);
      }
    });
  }

  actualizar(): void {
    if (!this.persona.nombre || !this.persona.telefono) {
      this.alerta.advertencia("Por favor rellene todos los campos requeridos (Nombre y Teléfono).");
      return;
    }

    this.cargando = true;
    const dto: PersonasDto = {
      nombre: this.persona.nombre,
      telefono: this.persona.telefono,
      tipoPersonas: this.persona.tipoPersonas,
      idPromotora: undefined
    };

    const operacion = this.modoCrear
      ? this.personasService.insertar(dto)
      : this.personasService.actualizar(this.idPersona, dto);

    operacion.subscribe({
      next: () => {
        this.cargando = false;
        this.alerta.exito(this.modoCrear ? "Propietario registrado con éxito." : "Propietario actualizado con éxito.");
        this.router.navigate(['/personas']);
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al guardar: " + (err.error || err.message));
      }
    });
  }

  eliminar(): void {
    this.alerta.confirmar(
      '¿Eliminar Propietario?',
      `¿Está seguro de que desea eliminar a "${this.persona.nombre}"?`
    ).then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.personasService.eliminar(this.idPersona).subscribe({
          next: () => {
            this.cargando = false;
            this.alerta.exito("Propietario eliminado con éxito.");
            this.router.navigate(['/personas']);
          },
          error: (err) => {
            this.cargando = false;
            this.cdr.detectChanges();
            this.alerta.error("Error al eliminar el propietario: " + (err.error || err.message));
          }
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/personas']);
  }
}
