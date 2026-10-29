import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EstadoGlobalService } from '../../../servicios/global-service';
import { PisosService } from '../../../servicios/pisos-service';
import { PersonasService } from '../../../servicios/personas-service';
import { AlertaService } from '../../../servicios/alerta-service';
import { PermisosService } from '../../../servicios/permisos.service';
import { PisosDto } from '../../../modelos/pisos.model';
import { PersonasRespuesta } from '../../../modelos/personas.model';

@Component({
  selector: 'app-detalle-piso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss'
})
export class DetallePisoComponent implements OnInit, OnDestroy {

  promocionId: number | null = null;
  idPiso!: number;
  cargando = false;
  puedeEditar = false;
  modoCrear = false;

  nuevoPiso: any = {
    piso: '',
    idPropietario: null
  };

  propietarios: PersonasRespuesta[] = [];
  placeholderPiso = 'Ej. 1º A, Ático B';

  // Variables para Dropdown Propietario Autocompletable
  busquedaPropietario = '';
  mostrarDropdownPropietario = false;
  propietariosFiltrados: PersonasRespuesta[] = [];

  private destroy$ = new Subject<void>();

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
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/pisos']);
      return;
    }

    this.puedeEditar = this.permisosService.puedeInsertarEditarPisosYPropietarios();

    if (idParam === 'nuevo') {
      this.modoCrear = true;
      this.nuevoPiso = {
        piso: '',
        idPropietario: null
      };
    } else {
      this.idPiso = Number(idParam);
    }

    this.globalService.promocion$
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.promocionId = id;
        if (id !== null) {
          this.cargarPropietarios();
          if (this.modoCrear) {
            this.cargarUltimoPiso();
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPropietarios(): void {
    this.personasService.obtenerTodas().subscribe({
      next: (res) => {
        this.propietarios = res;
        this.propietariosFiltrados = [...res];
        if (!this.modoCrear) {
          this.cargarDatosPiso();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar propietarios:", err)
    });
  }

  cargarUltimoPiso(): void {
    if (this.promocionId === null) return;
    this.pisosService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (pisos) => {
        if (pisos && pisos.length > 0) {
          const ultimo = pisos[pisos.length - 1];
          if (ultimo && ultimo.piso) {
            this.placeholderPiso = `Último registrado: ${ultimo.piso}`;
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al obtener pisos para sugerencia:", err)
    });
  }

  cargarDatosPiso(): void {
    if (!this.idPiso) return;
    this.cargando = true;
    this.pisosService.obtenerPorId(this.idPiso).subscribe({
      next: (res) => {
        this.nuevoPiso = {
          piso: res.piso,
          idPropietario: res.idPropietario || null
        };
        
        if (res.idPropietario) {
          const prop = this.propietarios.find(p => p.idPersona === res.idPropietario);
          if (prop) {
            this.busquedaPropietario = `${prop.nombre} (Tel: ${prop.telefono})`;
          } else {
            this.personasService.obtenerPorId(res.idPropietario).subscribe({
              next: (p) => {
                this.busquedaPropietario = `${p.nombre} (Tel: ${p.telefono})`;
                this.cdr.detectChanges();
              }
            });
          }
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar piso:", err);
        this.cargando = false;
        this.alerta.error("No se pudo cargar la información del piso.");
        this.router.navigate(['/pisos']);
      }
    });
  }

  // --- Lógica de Dropdown Propietario Autocompletable ---

  abrirDropdownPropietario(): void {
    if (!this.puedeEditar) return;
    this.mostrarDropdownPropietario = true;
    this.propietariosFiltrados = [...this.propietarios]; // Muestra siempre todos al dar click/focus
    this.cdr.detectChanges();
  }

  cerrarDropdownPropietario(): void {
    setTimeout(() => {
      this.mostrarDropdownPropietario = false;
      const match = this.propietarios.find(p => p.idPersona === this.nuevoPiso.idPropietario);
      this.busquedaPropietario = match ? `${match.nombre} (Tel: ${match.telefono})` : '';
      this.cdr.detectChanges();
    }, 150);
  }

  filtrarPropietarios(): void {
    const query = this.busquedaPropietario ? this.busquedaPropietario.toLowerCase() : '';
    const match = this.propietarios.find(p => p.idPersona === this.nuevoPiso.idPropietario);
    const selectedText = match ? `${match.nombre} (Tel: ${match.telefono})` : '';

    // Si coincide con la selección actual, mostramos todos
    if (match && selectedText === this.busquedaPropietario) {
      this.propietariosFiltrados = [...this.propietarios];
    } else {
      this.propietariosFiltrados = this.propietarios.filter(p =>
        (p.nombre && p.nombre.toLowerCase().includes(query)) ||
        (p.telefono && p.telefono.includes(query))
      );
    }
  }

  seleccionarPropietario(p: PersonasRespuesta): void {
    this.nuevoPiso.idPropietario = p.idPersona;
    this.busquedaPropietario = `${p.nombre} (Tel: ${p.telefono})`;
    this.mostrarDropdownPropietario = false;
  }

  limpiarPropietario(): void {
    this.nuevoPiso.idPropietario = null;
    this.busquedaPropietario = '';
    this.propietariosFiltrados = [...this.propietarios];
  }

  // --- Operaciones CRUD ---

  actualizar(): void {
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

    const operacion = this.modoCrear
      ? this.pisosService.insertar(dto)
      : this.pisosService.actualizar(this.idPiso, dto);

    operacion.subscribe({
      next: () => {
        this.cargando = false;
        this.alerta.exito(this.modoCrear ? "Piso registrado con éxito." : "Piso actualizado con éxito.");
        this.router.navigate(['/pisos']);
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al guardar el piso: " + (err.error || err.message));
      }
    });
  }

  eliminar(): void {
    this.alerta.confirmar(
      '¿Eliminar Piso?',
      `¿Está seguro de que desea eliminar el piso "${this.nuevoPiso.piso}"?`
    ).then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.pisosService.eliminar(this.idPiso).subscribe({
          next: () => {
            this.cargando = false;
            this.alerta.exito("Piso eliminado con éxito.");
            this.router.navigate(['/pisos']);
          },
          error: (err) => {
            this.cargando = false;
            this.cdr.detectChanges();
            this.alerta.error("Error al eliminar el piso: " + (err.error || err.message));
          }
        });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/pisos']);
  }
}
