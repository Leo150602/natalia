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
  terminoBusqueda = '';
  propietariosFiltrados: PersonasRespuesta[] = [];
  mostrarOpciones = false;
  propietarioSeleccionadoLabel = '';
  placeholderPiso = 'Ej. 1º A, Ático B';

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
        this.cargarUltimoPiso();
      }
    });

    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.modoEdicion = true;
      this.idPisoEdicion = Number(id);
    }
  }

  cargarPropietarios(): void {
    this.personasService.obtenerTodas().subscribe({
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

  cargarUltimoPiso(): void {
    if (this.promocionId === null) {
      this.placeholderPiso = 'Ej. 1º A, Ático B';
      return;
    }
    this.pisosService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (pisos) => {
        if (pisos && pisos.length > 0) {
          const ultimo = pisos[pisos.length - 1];
          if (ultimo && ultimo.piso) {
            this.placeholderPiso = `Último registrado: ${ultimo.piso}`;
          } else {
            this.placeholderPiso = 'Ej. 1º A, Ático B';
          }
        } else {
          this.placeholderPiso = 'Ej. 1º A, Ático B';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al obtener pisos para sugerencia:", err);
        this.placeholderPiso = 'Ej. 1º A, Ático B';
      }
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
        if (res.idPropietario) {
          const prop = this.propietarios.find(p => p.idPersona === res.idPropietario);
          if (prop) {
            const label = `${prop.nombre} (Tel: ${prop.telefono})`;
            this.terminoBusqueda = label;
            this.propietarioSeleccionadoLabel = label;
          } else {
            this.personasService.obtenerPorId(res.idPropietario).subscribe({
              next: (p) => {
                const label = `${p.nombre} (Tel: ${p.telefono})`;
                this.terminoBusqueda = label;
                this.propietarioSeleccionadoLabel = label;
                this.cdr.detectChanges();
              }
            });
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar piso para edición:", err)
    });
  }

  filtrarPropietarios(): void {
    const termino = this.terminoBusqueda.trim().toLowerCase();
    if (termino.length >= 2) {
      this.propietariosFiltrados = this.propietarios.filter(p =>
        (p.nombre && p.nombre.toLowerCase().includes(termino)) ||
        (p.telefono && p.telefono.includes(termino))
      );
    } else {
      this.propietariosFiltrados = [];
    }
  }

  seleccionarPropietario(p: PersonasRespuesta): void {
    this.nuevoPiso.idPropietario = p.idPersona;
    const label = `${p.nombre} (Tel: ${p.telefono})`;
    this.terminoBusqueda = label;
    this.propietarioSeleccionadoLabel = label;
    this.mostrarOpciones = false;
  }

  limpiarPropietarioSeleccionado(): void {
    this.nuevoPiso.idPropietario = null;
    this.terminoBusqueda = '';
    this.propietarioSeleccionadoLabel = '';
    this.propietariosFiltrados = [];
  }

  onBlur(): void {
    setTimeout(() => {
      this.mostrarOpciones = false;
    }, 200);
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
