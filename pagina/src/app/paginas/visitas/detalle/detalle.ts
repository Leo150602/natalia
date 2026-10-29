import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EstadoGlobalService } from '../../../servicios/global-service';
import { VisitasService } from '../../../servicios/visitas-service';
import { IncidenciasService } from '../../../servicios/incidencias-service';
import { AuthService, LoginRespuesta } from '../../../servicios/auth-service';
import { EnumService } from '../../../servicios/enum-service';
import { DocumentosService } from '../../../servicios/documentos-service';
import { AlertaService } from '../../../servicios/alerta-service';
import { PermisosService } from '../../../servicios/permisos.service';
import { IncidenciasRespuesta } from '../../../modelos/incidencias.model';
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
  
  incidencias: IncidenciasRespuesta[] = [];
  tecnicos: LoginRespuesta[] = [];
  estados: any[] = [];
  
  visita: any = {
    idIncidencia: null,
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

  // Documentos de la incidencia asociada
  documentosAsociados: any[] = [];
  mostrarModalSubir = false;
  cargandoSubir = false;
  docSubir = {
    nombre: '',
    estado: 'FALTAN_FIRMAS',
    archivo: null as File | null
  };

  // Solo Incidencia Asociada queda como Autocompletable Personalizado
  busquedaIncidencia = '';
  mostrarDropdownIncidencia = false;
  incidenciasFiltradas: IncidenciasRespuesta[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private estadoGlobal: EstadoGlobalService,
    private visitasService: VisitasService,
    private incidenciasService: IncidenciasService,
    private authService: AuthService,
    private enumService: EnumService,
    private documentosService: DocumentosService,
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
        idIncidencia: null,
        idTecnico: null,
        diaVisita: fechaQuery ? `${fechaQuery}T09:00` : new Date().toISOString().slice(0, 16),
        estadoVisita: '', // Se asignará vacío para Nata/Dev, u asignado por cargarEnums para otros
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
          this.cargarIncidencias();
        }
      });

    this.cargarTecnicos();
    this.cargarEnums();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarIncidencias(): void {
    if (this.promocionId === null) return;
    this.incidenciasService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.incidencias = res;
        this.incidenciasFiltradas = [...res];
        if (this.visita.idIncidencia) {
          const match = this.incidencias.find(i => i.idIncidencia === this.visita.idIncidencia);
          if (match) this.busquedaIncidencia = `${match.numeroIncidencia} - ${match.descripcion || 'Sin descripción'} (Piso: ${match.pisos?.piso})`;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar incidencias:", err)
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
          idIncidencia: res.idIncidencia || null,
          idTecnico: tecnicoId,
          diaVisita: res.diaVisita ? new Date(res.diaVisita).toISOString().slice(0, 16) : '',
          estadoVisita: keyEstado,
          observaciones: res.observaciones || ''
        };

        const incMatch = this.incidencias.find(i => i.idIncidencia === res.idIncidencia);
        this.busquedaIncidencia = incMatch ? `${incMatch.numeroIncidencia} - ${incMatch.descripcion || 'Sin descripción'} (Piso: ${incMatch.pisos?.piso})` : '';

        this.cargando = false;
        this.cargarDocumentosAsociados();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.alerta.error("No se pudo cargar la visita técnica.");
        this.router.navigate(['/visitas']);
      }
    });
  }

  // --- Lógica de Dropdown Incidencia Autocompletable ---

  abrirDropdownIncidencia(): void {
    if (!this.puedeEditar) return;
    this.mostrarDropdownIncidencia = true;
    this.incidenciasFiltradas = [...this.incidencias]; // Muestra siempre todos al dar click/focus
    this.cdr.detectChanges();
  }
  cerrarDropdownIncidencia(): void {
    setTimeout(() => {
      this.mostrarDropdownIncidencia = false;
      const match = this.incidencias.find(i => i.idIncidencia === this.visita.idIncidencia);
      this.busquedaIncidencia = match ? `${match.numeroIncidencia} - ${match.descripcion || 'Sin descripción'} (Piso: ${match.pisos?.piso})` : '';
      this.cdr.detectChanges();
    }, 150);
  }
  filtrarIncidencias(): void {
    const query = this.busquedaIncidencia ? this.busquedaIncidencia.toLowerCase() : '';
    const match = this.incidencias.find(i => i.idIncidencia === this.visita.idIncidencia);
    const selectedText = match ? `${match.numeroIncidencia} - ${match.descripcion || 'Sin descripción'} (Piso: ${match.pisos?.piso})` : '';

    // Si la búsqueda coincide exactamente con el valor actual, mostramos todos (el usuario solo clickeó de nuevo sin cambiar texto)
    if (match && selectedText === this.busquedaIncidencia) {
      this.incidenciasFiltradas = [...this.incidencias];
    } else {
      this.incidenciasFiltradas = this.incidencias.filter(i => 
        (i.numeroIncidencia && i.numeroIncidencia.toLowerCase().includes(query)) ||
        (i.descripcion && i.descripcion.toLowerCase().includes(query)) ||
        (i.pisos?.piso && i.pisos.piso.toLowerCase().includes(query))
      );
    }
  }
  seleccionarIncidencia(i: IncidenciasRespuesta): void {
    this.visita.idIncidencia = i.idIncidencia;
    this.busquedaIncidencia = `${i.numeroIncidencia} - ${i.descripcion || 'Sin descripción'} (Piso: ${i.pisos?.piso})`;
    this.mostrarDropdownIncidencia = false;
  }

  // --- Operaciones CRUD ---

  actualizar(): void {
    if (!this.visita.idIncidencia || !this.visita.idTecnico || !this.visita.diaVisita) {
      this.alerta.advertencia("Por favor complete los campos requeridos (Incidencia, Técnico y Fecha Visita).");
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    const fecha = new Date(this.visita.diaVisita).toISOString().split('.')[0];
    const dto: VisitasDto = {
      idTecnico: Number(this.visita.idTecnico),
      idIncidencia: Number(this.visita.idIncidencia),
      diaVisita: fecha,
      estadoVisita: this.visita.estadoVisita || null,
      observaciones: this.visita.observaciones || null
    };

    // Obtener la promoción y piso de la incidencia seleccionada
    const chosenInc = this.incidencias.find(i => i.idIncidencia === Number(this.visita.idIncidencia));
    const promoName = chosenInc?.pisos?.promocion;
    const floorName = chosenInc?.pisos?.piso;

    // Verificar si ya hay visitas agendadas para esta promoción y piso el mismo día
    this.visitasService.obtenerTodas().subscribe({
      next: (todasVisitas) => {
        const dateStrSelected = new Date(this.visita.diaVisita).toISOString().split('T')[0];
        const tieneDuplicado = (todasVisitas || []).some(v => {
          if (!this.modoCrear && v.idVisita === this.idVisita) return false;
          
          const mismaPromo = v.promocion && promoName && v.promocion.toUpperCase().trim() === promoName.toUpperCase().trim();
          const mismoPiso = v.piso && floorName && v.piso.toUpperCase().trim() === floorName.toUpperCase().trim();
          
          if (mismaPromo && mismoPiso) {
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
        // En caso de error, procedemos directo
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

  cargarDocumentosAsociados(): void {
    if (!this.visita.idIncidencia) return;
    this.documentosService.listarPorIncidencia(Number(this.visita.idIncidencia)).subscribe({
      next: (res) => {
        this.documentosAsociados = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar documentos de la incidencia:", err);
      }
    });
  }

  abrirModalSubir(): void {
    this.cargandoSubir = false;
    this.docSubir = {
      nombre: '',
      estado: 'FALTAN_FIRMAS',
      archivo: null
    };
    this.mostrarModalSubir = true;
    this.cdr.detectChanges();
  }

  cerrarModalSubir(): void {
    this.cargandoSubir = false;
    this.mostrarModalSubir = false;
    this.cdr.detectChanges();
  }

  onArchivoSeleccionadoSubir(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.docSubir.archivo = file;
      if (!this.docSubir.nombre) {
        this.docSubir.nombre = file.name.split('.')[0];
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext || '')) {
        this.docSubir.estado = 'NO_APLICA';
      } else {
        this.docSubir.estado = 'FALTAN_FIRMAS';
      }
      this.cdr.detectChanges();
    }
  }

  guardarDocIncidencia(): void {
    if (!this.visita.idIncidencia) {
      this.alerta.advertencia("No se puede subir evidencia sin una incidencia asociada.");
      return;
    }
    if (!this.docSubir.archivo) {
      this.alerta.advertencia("Por favor seleccione un archivo.");
      return;
    }
    this.cargandoSubir = true;
    this.cdr.detectChanges();

    this.documentosService.subirParaIncidencia(
      Number(this.visita.idIncidencia),
      this.docSubir.archivo,
      this.docSubir.estado,
      this.docSubir.nombre.trim()
    ).subscribe({
      next: () => {
        this.cargandoSubir = false;
        this.mostrarModalSubir = false;
        this.alerta.exito("Evidencia subida y asociada correctamente.");
        this.cargarDocumentosAsociados();
      },
      error: (err) => {
        this.cargandoSubir = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al subir evidencia: " + (err.error || err.message));
      }
    });
  }

  eliminarDocIncidencia(relacion: any): void {
    this.alerta.confirmar(
      '¿Eliminar Documento?',
      `¿Está seguro de que desea desasociar y eliminar el documento "${relacion.documento.nombre}"?`
    ).then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.cdr.detectChanges();
        this.documentosService.eliminarIncidenciaDocumento(relacion.id).subscribe({
          next: () => {
            this.cargando = false;
            this.alerta.exito("Documento eliminado con éxito.");
            this.cargarDocumentosAsociados();
          },
          error: (err) => {
            this.cargando = false;
            this.cdr.detectChanges();
            this.alerta.error("Error al eliminar documento: " + (err.error || err.message));
          }
        });
      }
    });
  }

  verDocumento(doc: any): void {
    if (doc && doc.ruta) {
      window.open(doc.ruta, '_blank');
    }
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

  // --- Visualizador de Evidencias ---
  mostrarVisualizadorDocumentos = false;
  tabActiva: 'imagenes' | 'videos' | 'documentos' = 'imagenes';
  indiceImagenGrande: number | null = null;

  abrirVisualizadorDocumentos(): void {
    this.mostrarVisualizadorDocumentos = true;
    this.tabActiva = 'imagenes';
    this.indiceImagenGrande = null;
    this.cdr.detectChanges();
  }

  cerrarVisualizadorDocumentos(): void {
    this.mostrarVisualizadorDocumentos = false;
    this.indiceImagenGrande = null;
    this.cdr.detectChanges();
  }

  esImagen(doc: any): boolean {
    if (!doc) return false;
    const format = doc.formato;
    const path = doc.ruta || '';
    const ext = path.split('.').pop()?.toLowerCase();
    
    if (['pdf', 'docx', 'xlsx', 'xls', 'txt'].includes(ext || '')) {
      return false;
    }
    
    return format === 'IMAGEN' || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '');
  }

  esVideo(doc: any): boolean {
    if (!doc) return false;
    const format = doc.formato;
    const path = doc.ruta || '';
    const ext = path.split('.').pop()?.toLowerCase();
    
    if (['pdf', 'docx', 'xlsx', 'xls', 'txt'].includes(ext || '')) {
      return false;
    }
    
    return format === 'VIDEO' || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext || '');
  }

  obtenerListaDeTab(tipo: 'imagenes' | 'videos' | 'documentos'): any[] {
    return this.documentosAsociados.filter(item => {
      const isImg = this.esImagen(item.documento);
      const isVid = this.esVideo(item.documento);
      if (tipo === 'imagenes') return isImg;
      if (tipo === 'videos') return isVid;
      return !isImg && !isVid;
    });
  }

  abrirLightbox(index: number): void {
    this.indiceImagenGrande = index;
    this.cdr.detectChanges();
  }

  cerrarLightbox(): void {
    this.indiceImagenGrande = null;
    this.cdr.detectChanges();
  }

  lightboxSiguiente(): void {
    if (this.indiceImagenGrande === null) return;
    const total = this.obtenerListaDeTab('imagenes').length;
    if (total === 0) return;
    this.indiceImagenGrande = (this.indiceImagenGrande + 1) % total;
    this.cdr.detectChanges();
  }

  lightboxAnterior(): void {
    if (this.indiceImagenGrande === null) return;
    const total = this.obtenerListaDeTab('imagenes').length;
    if (total === 0) return;
    this.indiceImagenGrande = (this.indiceImagenGrande - 1 + total) % total;
    this.cdr.detectChanges();
  }

  // --- Edición de Documentos ---
  mostrarModalEditar = false;
  cargandoEditar = false;
  seccionEdicion = 'METADATOS';
  docEditar = {
    id: 0,
    nombre: '',
    estado: '',
    archivo: null as File | null,
    relacionOriginal: null as any
  };

  abrirModalEditar(relacion: any): void {
    this.docEditar = {
      id: relacion.id,
      nombre: relacion.documento.nombre,
      estado: relacion.estado,
      archivo: null,
      relacionOriginal: relacion
    };
    this.seccionEdicion = 'METADATOS';
    this.mostrarModalEditar = true;
    this.cdr.detectChanges();
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.cdr.detectChanges();
  }

  onArchivoSeleccionadoEditar(e: any): void {
    const file = e.target.files?.[0];
    if (file) {
      this.docEditar.archivo = file;
      this.cdr.detectChanges();
    }
  }

  actualizarDocIncidencia(): void {
    if (!this.docEditar.nombre.trim()) {
      this.alerta.advertencia("Por favor escriba un nombre.");
      return;
    }
    this.cargandoEditar = true;
    this.cdr.detectChanges();
    this.documentosService.actualizarIncidenciaDocumento(
      this.docEditar.id,
      this.docEditar.archivo || undefined,
      this.docEditar.estado,
      this.docEditar.nombre.trim()
    ).subscribe({
      next: () => {
        this.cargandoEditar = false;
        this.mostrarModalEditar = false;
        this.alerta.exito("Documento actualizado con éxito.");
        this.cargarDocumentosAsociados();
      },
      error: (err) => {
        this.cargandoEditar = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al actualizar documento: " + (err.error || err.message));
      }
    });
  }
}
