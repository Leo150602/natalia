import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EstadoGlobalService } from '../../../servicios/global-service';
import { VisitasService } from '../../../servicios/visitas-service';
import { PisosService } from '../../../servicios/pisos-service';
import { AuthService, LoginRespuesta } from '../../../servicios/auth-service';
import { EnumService } from '../../../servicios/enum-service';
import { AlertaService } from '../../../servicios/alerta-service';
import { PermisosService } from '../../../servicios/permisos.service';
import { PisosRespuesta } from '../../../modelos/pisos.model';
import { VisitasDto } from '../../../modelos/visitas.model';

@Component({
  selector: 'app-detalle-visita',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss'
})
export class DetalleVisitaComponent implements OnInit, OnDestroy {

  idVisita!: number;
  promocionId: number | null = null;
  
  pisos: PisosRespuesta[] = [];
  tecnicos: LoginRespuesta[] = [];
  estados: any[] = [];
  
  visita: any = {
    idPiso: null,
    pisoNombre: '',
    promocion: '',
    propietario: '',
    telefonoPropietario: '',
    idTecnico: null,
    diaVisita: '',
    estadoVisita: '',
    observaciones: ''
  };

  cargando = false;
  puedeEditar = false;
  modoCrear = false;
  modoEdicion = false;
  origen: string | null = null;

  // Selector Autocompletable de Piso Asociado
  busquedaPiso = '';
  mostrarDropdownPiso = false;
  pisosFiltrados: PisosRespuesta[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private estadoGlobal: EstadoGlobalService,
    private visitasService: VisitasService,
    private pisosService: PisosService,
    private authService: AuthService,
    private enumService: EnumService,
    private alerta: AlertaService,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.origen = this.route.snapshot.queryParamMap.get('origen');
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/visitas']);
      return;
    }

    if (idParam === 'nuevo') {
      this.modoCrear = true;
      this.modoEdicion = true;
      this.puedeEditar = true; // Permite a cualquiera rellenar el formulario al crear
      const fechaQuery = this.route.snapshot.queryParamMap.get('fecha');
      this.visita = {
        idPiso: null,
        pisoNombre: '',
        promocion: '',
        propietario: '',
        telefonoPropietario: '',
        idTecnico: null,
        diaVisita: fechaQuery ? `${fechaQuery}T09:00` : new Date().toISOString().slice(0, 16),
        estadoVisita: '',
        observaciones: ''
      };
    } else {
      this.idVisita = Number(idParam);
      this.puedeEditar = this.permisosService.puedeInsertarEditarIncidencias();
    }

    this.estadoGlobal.promocion$
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.promocionId = id;
        if (id !== null) {
          this.cargarPisos();
        }
      });

    this.cargarTecnicos();
    this.cargarEnums();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatearTextoPiso(p: PisosRespuesta): string {
    return p.propietario ? `${p.piso} - ${p.propietario}` : `${p.piso}`;
  }

  cargarPisos(): void {
    if (this.promocionId === null) return;
    this.pisosService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.pisos = res || [];
        this.pisosFiltrados = [...this.pisos];
        if (this.visita.idPiso) {
          const match = this.pisos.find(p => p.idPiso === this.visita.idPiso);
          if (match) {
            this.busquedaPiso = this.formatearTextoPiso(match);
            this.visita.pisoNombre = match.piso;
            this.visita.promocion = match.promocion;
            this.visita.propietario = match.propietario || '';
            this.visita.telefonoPropietario = match.telefonoPropietario || '';
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar pisos:", err)
    });
  }

  cargarTecnicos(): void {
    this.authService.getTecnicos().subscribe({
      next: (res) => {
        this.tecnicos = res;
        if (!this.modoCrear) {
          this.cargarDetalleVisita();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar técnicos:", err)
    });
  }

  cargarEnums(): void {
    this.enumService.obtenerTodosLosEnums().subscribe({
      next: (res) => {
        this.estados = res.estadosVisita || [];
        
        // Detección dinámica de la opción "solicitada" o "solicitado"
        const solicitadoEnum = this.estados.find(e => e.value.toLowerCase().includes('solicitad'));
        const valorSolicitado = solicitadoEnum ? solicitadoEnum.value : 'SOLICITADA';

        if (this.modoCrear) {
          if (this.permisosService.puedeInsertarEditar()) {
            this.visita.estadoVisita = ''; // Nata/Dev inicia sin ninguna opción seleccionada
          } else {
            this.visita.estadoVisita = valorSolicitado; // Para otros roles, se asigna como solicitado
          }
        }

        // Si es Nata/Dev, se excluye la opción "SOLICITADO"/"SOLICITADA" del select para que no la puedan escoger
        if (this.permisosService.puedeInsertarEditar()) {
          this.estados = this.estados.filter(e => e.value !== valorSolicitado);
        }

        if (!this.modoCrear) {
          this.cargarDetalleVisita();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar enums de visita:", err)
    });
  }

  cargarDetalleVisita(): void {
    if (!this.idVisita) return;
    if (this.tecnicos.length === 0 || this.estados.length === 0) return;

    this.cargando = true;
    this.visitasService.obtenerPorId(this.idVisita).subscribe({
      next: (res) => {
        let keyEstado = '';
        if (res.estadoVisita) {
          const match = this.estados.find(e => e.descripcion === res.estadoVisita);
          keyEstado = match ? match.value : res.estadoVisita;
        }

        let tecnicoId = null;
        if (res.tecnicoNombre) {
          const matchT = this.tecnicos.find(t => t.nombre === res.tecnicoNombre || t.username === res.tecnicoNombre);
          tecnicoId = matchT ? matchT.id : null;
        }

        this.visita = {
          idPiso: res.idPiso || null,
          pisoNombre: res.piso || '',
          promocion: res.promocion || '',
          propietario: res.propietario || '',
          telefonoPropietario: res.telefonoPropietario || '',
          idTecnico: tecnicoId,
          diaVisita: res.diaVisita ? new Date(res.diaVisita).toISOString().slice(0, 16) : '',
          estadoVisita: keyEstado,
          observaciones: res.observaciones || ''
        };

        const pisoMatch = this.pisos.find(p => p.idPiso === res.idPiso || (res.piso && p.piso === res.piso));
        if (pisoMatch) {
          this.visita.idPiso = pisoMatch.idPiso;
          this.busquedaPiso = this.formatearTextoPiso(pisoMatch);
        } else {
          this.busquedaPiso = res.piso ? (res.propietario ? `${res.piso} - ${res.propietario}` : res.piso) : '';
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.alerta.error("No se pudo cargar la visita técnica.");
        this.router.navigate(['/visitas']);
      }
    });
  }

  // --- Lógica de Dropdown Piso Autocompletable ---

  abrirDropdownPiso(): void {
    if (!this.puedeEditar) return;
    this.mostrarDropdownPiso = true;
    this.pisosFiltrados = [...this.pisos]; // Muestra siempre todos al dar click/focus
    this.cdr.detectChanges();
  }

  cerrarDropdownPiso(): void {
    setTimeout(() => {
      this.mostrarDropdownPiso = false;
      const match = this.pisos.find(p => p.idPiso === this.visita.idPiso);
      if (match) {
        this.busquedaPiso = this.formatearTextoPiso(match);
      }
      this.cdr.detectChanges();
    }, 150);
  }

  filtrarPisos(): void {
    const query = this.busquedaPiso ? this.busquedaPiso.toLowerCase() : '';
    const match = this.pisos.find(p => p.idPiso === this.visita.idPiso);
    const selectedText = match ? this.formatearTextoPiso(match) : '';

    // Si la búsqueda coincide exactamente con el valor actual, mostramos todos (el usuario solo clickeó de nuevo sin cambiar texto)
    if (match && selectedText === this.busquedaPiso) {
      this.pisosFiltrados = [...this.pisos];
    } else {
      this.pisosFiltrados = this.pisos.filter(p => 
        (p.piso && p.piso.toLowerCase().includes(query)) ||
        (p.propietario && p.propietario.toLowerCase().includes(query))
      );
    }
  }

  seleccionarPiso(p: PisosRespuesta): void {
    this.visita.idPiso = p.idPiso;
    this.visita.pisoNombre = p.piso;
    this.visita.promocion = p.promocion;
    this.visita.propietario = p.propietario || '';
    this.visita.telefonoPropietario = p.telefonoPropietario || '';
    this.busquedaPiso = this.formatearTextoPiso(p);
    this.mostrarDropdownPiso = false;
  }

  // --- Operaciones CRUD ---

  actualizar(): void {
    if (!this.visita.idPiso || !this.visita.idTecnico || !this.visita.diaVisita) {
      this.alerta.advertencia("Por favor complete los campos requeridos (Piso, Técnico y Fecha Visita).");
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    const fecha = new Date(this.visita.diaVisita).toISOString().split('.')[0];
    const dto: VisitasDto = {
      idTecnico: Number(this.visita.idTecnico),
      idPiso: Number(this.visita.idPiso),
      diaVisita: fecha,
      estadoVisita: this.visita.estadoVisita || null,
      observaciones: this.visita.observaciones || null
    };

    // Obtener la promoción y piso seleccionados
    const chosenPiso = this.pisos.find(p => p.idPiso === Number(this.visita.idPiso));
    const promoName = chosenPiso?.promocion;
    const floorName = chosenPiso?.piso;

    // Verificar si ya hay visitas agendadas para esta promoción y piso el mismo día
    this.visitasService.obtenerTodas().subscribe({
      next: (todasVisitas) => {
        const dateStrSelected = new Date(this.visita.diaVisita).toISOString().split('T')[0];
        const tieneDuplicado = (todasVisitas || []).some(v => {
          if (!this.modoCrear && v.idVisita === this.idVisita) return false;
          
          const mismaPromo = v.promocion && promoName && v.promocion.toUpperCase().trim() === promoName.toUpperCase().trim();
          const mismoPiso = (v.idPiso && v.idPiso === Number(this.visita.idPiso)) ||
                            (v.piso && floorName && v.piso.toUpperCase().trim() === floorName.toUpperCase().trim() && mismaPromo);
          
          if (mismoPiso) {
            if (v.diaVisita) {
              const vDateStr = new Date(v.diaVisita).toISOString().split('T')[0];
              return vDateStr === dateStrSelected;
            }
          }
          return false;
        });

        if (tieneDuplicado) {
          this.cargando = false;
          this.cdr.detectChanges();
          
          this.alerta.confirmar(
            '¿Agendar Visita Duplicada?',
            `Ya existe una visita agendada para la promoción "${promoName}" - Piso "${floorName}" en este día. ¿Está seguro de que desea asignar otra visita para el mismo día?`,
            'Sí, agendar'
          ).then((confirmado) => {
            if (confirmado) {
              this.cargando = true;
              this.cdr.detectChanges();
              this.ejecutarGuardado(dto);
            }
          });
        } else {
          this.ejecutarGuardado(dto);
        }
      },
      error: (err) => {
        console.error("Error al verificar duplicidad de visitas:", err);
        this.ejecutarGuardado(dto);
      }
    });
  }

  ejecutarGuardado(dto: VisitasDto): void {
    const operacion = this.modoCrear
      ? this.visitasService.insertar(dto)
      : this.visitasService.actualizar(this.idVisita, dto);

    operacion.subscribe({
      next: () => {
        this.cargando = false;
        this.alerta.exito(this.modoCrear ? "Visita técnica registrada con éxito." : "Visita técnica actualizada con éxito.");
        this.volver();
      },
      error: (err) => {
        this.cargando = false;
        this.alerta.error("Error al guardar la visita: " + (err.error || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(): void {
    this.alerta.confirmar(
      '¿Eliminar Visita?',
      `¿Está seguro de que desea eliminar esta visita técnica? Esta acción no se puede deshacer.`
    ).then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.visitasService.eliminar(this.idVisita).subscribe({
          next: () => {
            this.cargando = false;
            this.alerta.exito("Visita técnica eliminada con éxito.");
            this.volver();
          },
          error: (err) => {
            this.cargando = false;
            this.alerta.error("Error al eliminar la visita: " + (err.error || err.message));
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  volver(): void {
    if (this.origen === 'calendario') {
      if (this.visita.diaVisita) {
        const dateStr = this.visita.diaVisita.slice(0, 10); // YYYY-MM-DD
        this.router.navigate([`/visitas/dia/${dateStr}`]);
      } else {
        this.router.navigate(['/visitas/calendario']);
      }
    } else {
      this.router.navigate(['/visitas']);
    }
  }

  activarModoEdicion(): void {
    this.modoEdicion = true;
    this.puedeEditar = true;
    this.cdr.detectChanges();
  }

  obtenerNombreTecnico(id: any): string {
    if (!id) return 'No asignado';
    const tec = this.tecnicos.find(t => t.id === Number(id));
    return (tec ? tec.nombre : 'No asignado') || 'No asignado';
  }

  cancelar(): void {
    if (this.modoEdicion && !this.modoCrear) {
      this.modoEdicion = false;
      this.puedeEditar = false;
      this.cargarDetalleVisita();
    } else {
      this.volver();
    }
  }
}
