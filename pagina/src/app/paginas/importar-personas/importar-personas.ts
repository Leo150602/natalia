import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PersonasService } from '../../servicios/personas-service';
import { EnumService } from '../../servicios/enum-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PermisosService } from '../../servicios/permisos.service';
import { PromotorasService } from '../../servicios/promotoras-service';
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

  modoEdicion = false;
  idPersonaEdicion: number | null = null;

  nuevaPersona: any = {
    nombre: '',
    telefono: '',
    tipoPersonas: ''
  };

  promotorasList: any[] = [];
  idPromotora: number | null = null;

  constructor(
    private personasService: PersonasService,
    private enumService: EnumService,
    private alerta: AlertaService,
    private router: Router,
    private route: ActivatedRoute,
    public permisosService: PermisosService,
    private promotorasService: PromotorasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeInsertarEditarPisosYPropietarios()) {
      this.router.navigate(['/personas']);
      return;
    }

    this.nuevaPersona.tipoPersonas = 'PROPIETARIO';
    this.cargarPromotoras();

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
        this.nuevaPersona = {
          nombre: res.nombre,
          telefono: res.telefono,
          tipoPersonas: 'PROPIETARIO'
        };
        this.idPromotora = res.idPromotora || null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar persona para edición:", err)
    });
  }

  cargarRoles(): void {
    // No longer loading roles dynamically
  }

  cargarPromotoras(): void {
    this.promotorasService.obtenerTodas().subscribe({
      next: (res) => {
        this.promotorasList = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar promotoras:", err)
    });
  }

  obtenerTituloForm(): string {
    const etiq = this.permisosService.obtenerEtiquetaCrearPersonas();
    return this.modoEdicion ? etiq.replace('Crear', 'Editar') : etiq;
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
      tipoPersonas: this.nuevaPersona.tipoPersonas,
      idPromotora: this.idPromotora || undefined
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
        this.cdr.detectChanges();
        this.alerta.error("Error al guardar persona: " + (err.error || err.message));
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/personas']);
  }
}
