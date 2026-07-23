import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PersonasService } from '../../servicios/personas-service';
import { EnumService } from '../../servicios/enum-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PersonasDto } from '../../modelos/personas.model';

@Component({
  selector: 'app-importar-personas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importar-personas.html',
  styleUrl: './importar-personas.scss'
})
export class ImportarPersonasComponent implements OnInit {

  cargando = false;
  roles: any[] = [];

  // Control de Edición
  modoEdicion = false;
  idPersonaEdicion: number | null = null;

  nuevaPersona: any = {
    nombre: '',
    telefono: '',
    tipoPersonas: ''
  };

  constructor(
    private personasService: PersonasService,
    private enumService: EnumService,
    private alerta: AlertaService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarRoles();

    // Comprobar si se ha pasado un ID para editar
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.modoEdicion = true;
      this.idPersonaEdicion = Number(id);
      this.cargarDatosPersonaEdicion();
    }
  }

  cargarDatosPersonaEdicion(): void {
    if (this.idPersonaEdicion === null) return;
    this.personasService.obtenerPorId(this.idPersonaEdicion).subscribe({
      next: (res) => {
        // Enlazar los datos del DTO al formulario
        // Res.tipoPersonas es la descripción mapeada por el DTO.
        // Buscamos el key del enum que coincida en this.roles
        let keyRol = '';
        if (res.tipoPersonas) {
          const match = this.roles.find(r => r.descripcion === res.tipoPersonas);
          if (match) {
            keyRol = match.value;
          } else {
            // fallback
            keyRol = res.tipoPersonas;
          }
        }

        this.nuevaPersona = {
          nombre: res.nombre,
          telefono: res.telefono,
          tipoPersonas: keyRol
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar persona para edición:", err)
    });
  }

  cargarRoles(): void {
    this.enumService.obtenerTodosLosEnums().subscribe({
      next: (res) => {
        this.roles = res.tiposPersona || [];
        this.cdr.detectChanges(); // Forzar renderizado
        if (this.modoEdicion) {
          this.cargarDatosPersonaEdicion(); // Re-cargar para asegurar que coincidan los roles
        }
      },
      error: (err) => console.error("Error al cargar roles:", err)
    });
  }

  guardar(): void {
    if (!this.nuevaPersona.nombre || !this.nuevaPersona.telefono || !this.nuevaPersona.tipoPersonas) {
      this.alerta.advertencia("Por favor rellene todos los campos del formulario.");
      return;
    }

    this.cargando = true;

    const dto: PersonasDto = {
      nombre: this.nuevaPersona.nombre,
      telefono: this.nuevaPersona.telefono,
      tipoPersonas: this.nuevaPersona.tipoPersonas
    };

    const operacion = this.modoEdicion && this.idPersonaEdicion !== null
      ? this.personasService.actualizar(this.idPersonaEdicion, dto)
      : this.personasService.insertar(dto);

    operacion.subscribe({
      next: () => {
        this.cargando = false;
        this.alerta.exito(this.modoEdicion ? "Persona actualizada con éxito." : "Persona registrada con éxito.");
        this.router.navigate(['/personas']);
      },
      error: (err) => {
        this.cargando = false;
        this.alerta.error("Error al guardar persona: " + (err.error || err.message));
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/personas']);
  }
}
