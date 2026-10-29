import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EstadoGlobalService } from '../../../servicios/global-service';
import { IncidenciasService } from '../../../servicios/incidencias-service';
import { PisosService } from '../../../servicios/pisos-service';
import { EnumService } from '../../../servicios/enum-service';
import { AlertaService } from '../../../servicios/alerta-service';
import { PermisosService } from '../../../servicios/permisos.service';
import { PisosRespuesta } from '../../../modelos/pisos.model';
import { IncidenciasDto } from '../../../modelos/incidencias.model';
import { DocumentosService } from '../../../servicios/documentos-service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-detalle-incidencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss'
})
export class DetalleIncidenciaComponent implements OnInit, OnDestroy {

  idIncidencia!: number;
  promocionId: number | null = null;
  pisos: PisosRespuesta[] = [];
  
  categorias: any[] = [];
  estados: any[] = [];
  horasLista: any[] = [];
  respuestasSNN: any[] = [
    { value: 'SI', descripcion: 'Sí' },
    { value: 'NO', descripcion: 'No' },
    { value: 'NA', descripcion: 'N/A' }
  ];

  incidencia: any = {
    numeroIncidencia: '',
    idPiso: null,
    categoriaIncidencia: '',
    descripcionIncidencia: '',
    observaciones: '',
    materialesRequeridos: '',
    estadoIncidencia: '',
    horasTrabajadas: '',
    presupuesto: '',
    proforma: '',
    fechaIncidencia: ''
  };

  cargando = false;
  puedeEditar = false;
  modoCrear = false;
  modoEdicion = false;
  placeholderNumeroIncidencia = 'Ej. INC-001';

  // Solo Piso queda como Autocompletable Personalizado
  busquedaPiso = '';
  mostrarDropdownPiso = false;
  pisosFiltrados: PisosRespuesta[] = [];

  documentosAsociados: any[] = [];
  mostrarModalSubir = false;
  mostrarModalEditar = false;
  cargandoSubir = false;
  cargandoEditar = false;
  documentoEnVista: any = null;
  safePreviewUrl: SafeResourceUrl | null = null;

  // Context menu properties
  menuContextualVisible = false;
  menuContextualPosicion = { x: '0px', y: '0px' };
  documentoSeleccionadoContextual: any = null;

  docSubir = {
    nombre: '',
    estado: 'FALTAN_FIRMAS',
    archivo: null as File | null,
    origen: 'LOCAL',
    plantillaId: ''
  };

  docEditar = {
    id: 0,
    nombre: '',
    estado: '',
    archivo: null as File | null,
    relacionOriginal: null as any
  };

  seccionEdicion = '';
  lienzoEdicionRelacionId: number | null = null;
  activeBlobUrls: string[] = [];

  plantillasDisponibles: any[] = [];
  plantillasFiltradas: any[] = [];
  busquedaPlantilla = '';
  mostrarDropdownPlantillas = false;
  mostrarEditorLienzo = false;
  mostrarSignaturePad = false;
  esPdfLienzo = false;
  backgroundLienzoUrl = '';
  lienzoNombreDoc = '';
  lienzoEstadoDoc = 'FALTAN_FIRMAS';
  cargandoLienzo = false;

  elementosLienzo: any[] = [];
  elementoArrastrando: any = null;
  elementoRedimensionando: any = null;
  dragOffsetX = 0;
  dragOffsetY = 0;
  resizeStartX = 0;
  resizeStartY = 0;
  resizeStartWidth = 0;
  resizeStartHeight = 0;
  sigDrawing = false;
  sigLastX = 0;
  sigLastY = 0;
  contadorIdElemento = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private estadoGlobal: EstadoGlobalService,
    private incidenciasService: IncidenciasService,
    private pisosService: PisosService,
    private enumService: EnumService,
    private alerta: AlertaService,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef,
    private documentosService: DocumentosService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/incidencias']);
      return;
    }

    if (idParam === 'nuevo') {
      this.modoCrear = true;
      this.modoEdicion = true;
      // Cualquiera puede llenar el formulario al crear/solicitar
      this.puedeEditar = true; 
      
      this.incidencia = {
        numeroIncidencia: '',
        idPiso: null,
        categoriaIncidencia: '',
        descripcionIncidencia: '',
        observaciones: '',
        materialesRequeridos: '',
        estadoIncidencia: '', // Iniciará vacío para Nata/Dev, u asignado por cargarEnums para otros
        horasTrabajadas: '',
        presupuesto: 'NO',
        proforma: 'NO',
        fechaIncidencia: new Date().toISOString().slice(0, 16)
      };
    } else {
      this.idIncidencia = Number(idParam);
      this.puedeEditar = this.permisosService.puedeInsertarEditarIncidencias();
    }

    this.estadoGlobal.promocion$
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.promocionId = id;
        if (id !== null) {
          this.cargarPisos();
          if (this.modoCrear) {
            this.cargarUltimoNumeroIncidencia();
          }
        }
      });

    this.cargarEnums();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activeBlobUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    });
  }

  cargarPisos(): void {
    if (this.promocionId === null) return;
    this.pisosService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.pisos = res;
        this.pisosFiltrados = [...res];
        if (this.incidencia.idPiso) {
          const match = this.pisos.find(p => p.idPiso === this.incidencia.idPiso);
          if (match) this.busquedaPiso = match.piso;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar pisos:", err)
    });
  }

  cargarEnums(): void {
    this.enumService.obtenerTodosLosEnums().subscribe({
      next: (res) => {
        this.categorias = res.categorias || [];
        this.estados = res.estadosIncidencia || [];
        this.horasLista = res.horasTrabajadas || [];
        
        // Detección dinámica de la opción "solicitado"
        const solicitadoEnum = this.estados.find(e => e.value.toLowerCase().includes('solicitad'));
        const valorSolicitado = solicitadoEnum ? solicitadoEnum.value : 'SOLICITADO';

        if (this.modoCrear) {
          if (this.permisosService.puedeInsertarEditar()) {
            this.incidencia.estadoIncidencia = ''; // Nata/Dev inicia sin ninguna opción seleccionada
          } else {
            this.incidencia.estadoIncidencia = valorSolicitado; // Para otros roles, se asigna como solicitado
          }
        }

        // Si es Nata/Dev, se excluye la opción "SOLICITADO" del select para que no la puedan escoger al crear/editar
        if (this.permisosService.puedeInsertarEditar()) {
          this.estados = this.estados.filter(e => e.value !== valorSolicitado);
        }

        if (!this.modoCrear) {
          this.cargarDetalleIncidencia();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar enums:", err)
    });
  }

  cargarUltimoNumeroIncidencia(): void {
    if (this.promocionId === null) return;
    this.incidenciasService.obtenerPorPromocion(this.promocionId, true).subscribe({
      next: (incidencias) => {
        if (incidencias && incidencias.length > 0) {
          let maxNum = -1;
          let maxIncidenciaStr = '';
          
          incidencias.forEach(inc => {
            if (inc.numeroIncidencia) {
              const numPart = inc.numeroIncidencia.replace(/\D/g, '');
              if (numPart) {
                const numVal = parseInt(numPart, 10);
                if (numVal > maxNum) {
                  maxNum = numVal;
                  maxIncidenciaStr = inc.numeroIncidencia;
                }
              }
            }
          });
          
          if (maxIncidenciaStr) {
            const prefix = maxIncidenciaStr.replace(/\d+$/, '');
            const numPart = maxIncidenciaStr.match(/\d+$/);
            if (numPart) {
              const nextNum = parseInt(numPart[0], 10) + 1;
              const paddedNum = String(nextNum).padStart(numPart[0].length, '0');
              this.incidencia.numeroIncidencia = `${prefix}${paddedNum}`;
            } else {
              this.placeholderNumeroIncidencia = `Última: ${maxIncidenciaStr}`;
            }
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al obtener incidencias para sugerencia:", err)
    });
  }

  cargarDetalleIncidencia(): void {
    this.cargando = true;
    this.incidenciasService.obtenerPorId(this.idIncidencia).subscribe({
      next: (res) => {
        const catMatch = this.categorias.find(c => c.descripcion === res.categoria);
        const estMatch = this.estados.find(e => e.descripcion === res.estado);
        const horMatch = this.horasLista.find(h => h.descripcion === res.horas);
        const presMatch = this.respuestasSNN.find(r => r.descripcion === res.presupuesto);
        const profMatch = this.respuestasSNN.find(r => r.descripcion === res.proforma);

        this.incidencia = {
          numeroIncidencia: res.numeroIncidencia,
          idPiso: res.pisos ? res.pisos.idPiso : null,
          categoriaIncidencia: catMatch ? catMatch.value : '',
          descripcionIncidencia: res.descripcion || '',
          observaciones: res.observacion || '',
          materialesRequeridos: res.materialesRequeridos || '',
          estadoIncidencia: estMatch ? estMatch.value : (res.estado || ''),
          horasTrabajadas: horMatch ? horMatch.value : '',
          presupuesto: presMatch ? presMatch.value : '',
          proforma: profMatch ? profMatch.value : '',
          fechaIncidencia: res.fechaIncidencia ? new Date(res.fechaIncidencia).toISOString().slice(0, 16) : ''
        };

        this.busquedaPiso = res.pisos ? res.pisos.piso : '';

        this.cargando = false;
        this.cargarDocumentosAsociados();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.alerta.error("No se pudo cargar la incidencia.");
        this.router.navigate(['/incidencias']);
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
      const match = this.pisos.find(p => p.idPiso === this.incidencia.idPiso);
      this.busquedaPiso = match ? match.piso : '';
      this.cdr.detectChanges();
    }, 150);
  }
  filtrarPisos(): void {
    const query = this.busquedaPiso ? this.busquedaPiso.toLowerCase() : '';
    const match = this.pisos.find(p => p.idPiso === this.incidencia.idPiso);
    
    // Si la búsqueda coincide exactamente con el valor actual, mostramos todos (el usuario solo clickeó de nuevo sin cambiar texto)
    if (match && match.piso === this.busquedaPiso) {
      this.pisosFiltrados = [...this.pisos];
    } else {
      this.pisosFiltrados = this.pisos.filter(p => p.piso && p.piso.toLowerCase().includes(query));
    }
  }
  seleccionarPiso(p: PisosRespuesta): void {
    this.incidencia.idPiso = p.idPiso;
    this.busquedaPiso = p.piso;
    this.mostrarDropdownPiso = false;
  }

  // --- Operaciones CRUD ---

  actualizar(): void {
    if (!this.incidencia.numeroIncidencia || !this.incidencia.idPiso) {
      this.alerta.advertencia("Los campos Nº Incidencia y Piso son obligatorios.");
      return;
    }

    this.cargando = true;
    let fecha = null;
    if (this.incidencia.fechaIncidencia) {
      fecha = new Date(this.incidencia.fechaIncidencia).toISOString().split('.')[0];
    }

    const dto: IncidenciasDto = {
      numeroIncidencia: this.incidencia.numeroIncidencia,
      categoriaIncidencia: this.incidencia.categoriaIncidencia || null,
      descripcionIncidencia: this.incidencia.descripcionIncidencia || null,
      observaciones: this.incidencia.observaciones || null,
      materialesRequeridos: this.incidencia.materialesRequeridos || null,
      estadoIncidencia: this.incidencia.estadoIncidencia || null,
      horasTrabajadas: this.incidencia.horasTrabajadas || null,
      presupuesto: this.incidencia.presupuesto || null,
      proforma: this.incidencia.proforma || null,
      idPiso: Number(this.incidencia.idPiso),
      fechaIncidencia: fecha
    };

    const operacion = this.modoCrear
      ? this.incidenciasService.insertar(dto)
      : this.incidenciasService.actualizar(this.idIncidencia, dto);

    operacion.subscribe({
      next: () => {
        this.cargando = false;
        this.alerta.exito(this.modoCrear ? "Incidencia registrada con éxito." : "Incidencia actualizada con éxito.");
        this.router.navigate(['/incidencias']);
      },
      error: (err) => {
        this.cargando = false;
        this.alerta.error("Error al guardar la incidencia: " + (err.error || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(): void {
    this.alerta.confirmar(
      '¿Eliminar Incidencia?',
      `¿Está seguro de que desea eliminar la incidencia "${this.incidencia.numeroIncidencia}"? Esta acción no se puede deshacer.`
    ).then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.incidenciasService.eliminar(this.idIncidencia).subscribe({
          next: () => {
            this.cargando = false;
            this.alerta.exito("Incidencia eliminada con éxito.");
            this.router.navigate(['/incidencias']);
          },
          error: (err) => {
            this.cargando = false;
            this.alerta.error("Error al eliminar la incidencia: " + (err.error || err.message));
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  activarModoEdicion(): void {
    this.modoEdicion = true;
    this.puedeEditar = true;
    this.cdr.detectChanges();
  }

  cancelar(): void {
    if (this.modoEdicion && !this.modoCrear) {
      this.modoEdicion = false;
      this.puedeEditar = false;
      this.cargarDetalleIncidencia();
    } else {
      this.router.navigate(['/incidencias']);
    }
  }

  // --- Métodos de Documentos Asociados ---

  cargarDocumentosAsociados(): void {
    if (!this.idIncidencia) return;
    this.documentosService.listarPorIncidencia(this.idIncidencia).subscribe({
      next: (res) => {
        this.documentosAsociados = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar documentos asociados:", err);
      }
    });

    this.documentosService.listar().subscribe({
      next: (res) => {
        this.plantillasDisponibles = (res || []).filter(d => 
          d.tipoDocumento === 'PLANTILLA' && (d.formato === 'DOCX' || d.formato === 'PDF')
        );
        this.plantillasFiltradas = [...this.plantillasDisponibles];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al obtener plantillas:", err)
    });
  }

  abrirModalSubir(): void {
    this.cargandoSubir = false;
    this.docSubir = {
      nombre: '',
      estado: 'FALTAN_FIRMAS',
      archivo: null,
      origen: 'LOCAL',
      plantillaId: ''
    };
    this.busquedaPlantilla = '';
    this.mostrarDropdownPlantillas = false;
    this.plantillasFiltradas = [...this.plantillasDisponibles];
    this.mostrarModalSubir = true;
    this.cdr.detectChanges();
  }

  cerrarModalSubir(): void {
    this.cargandoSubir = false;
    this.mostrarModalSubir = false;
    this.cdr.detectChanges();
  }

  onArchivoSeleccionadoSubir(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.docSubir.archivo = file;
      if (!this.docSubir.nombre || this.docSubir.nombre.trim() === '') {
        const lastDot = file.name.lastIndexOf('.');
        this.docSubir.nombre = lastDot > 0 ? file.name.substring(0, lastDot) : file.name;
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
    if (!this.docSubir.archivo) {
      this.alerta.advertencia("Por favor seleccione un archivo.");
      return;
    }
    this.cargandoSubir = true;
    this.cdr.detectChanges();
    this.documentosService.subirParaIncidencia(
      this.idIncidencia,
      this.docSubir.archivo,
      this.docSubir.estado,
      this.docSubir.nombre.trim()
    ).subscribe({
      next: () => {
        this.cargandoSubir = false;
        this.mostrarModalSubir = false;
        this.alerta.exito("Documento subido y asociado correctamente.");
        this.cargarDocumentosAsociados();
      },
      error: (err) => {
        this.cargandoSubir = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al subir el documento: " + (err.error || err.message));
      }
    });
  }

  abrirModalEditar(relacion: any): void {
    this.docEditar = {
      id: relacion.id,
      nombre: relacion.documento.nombre,
      estado: relacion.estado,
      archivo: null,
      relacionOriginal: relacion
    };
    this.seccionEdicion = '';
    this.mostrarModalEditar = true;
    this.cdr.detectChanges();
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.cdr.detectChanges();
  }

  onArchivoSeleccionadoEditar(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.docEditar.archivo = file;
      this.cdr.detectChanges();
    }
  }

  actualizarDocIncidencia(): void {
    if (!this.docEditar.nombre || !this.docEditar.nombre.trim()) {
      this.alerta.advertencia("Por favor escriba un nombre para el documento.");
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
        this.alerta.exito("Documento actualizado correctamente.");
        this.cargarDocumentosAsociados();
      },
      error: (err) => {
        this.cargandoEditar = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al actualizar el documento: " + (err.error || err.message));
      }
    });
  }

  eliminarDocIncidencia(relacion: any): void {
    this.alerta.confirmar(
      "¿Eliminar Documento?",
      `¿Está seguro de que desea eliminar la relación con "${relacion.documento.nombre}"? Esto también eliminará el archivo del almacenamiento en la nube.`,
      "Sí, eliminar"
    ).then((confirmado) => {
      if (confirmado) {
        this.documentosService.eliminarIncidenciaDocumento(relacion.id).subscribe({
          next: () => {
            this.alerta.exito("Documento eliminado correctamente.");
            this.cargarDocumentosAsociados();
          },
          error: (err) => {
            this.alerta.error("Error al eliminar el documento: " + (err.error || err.message));
          }
        });
      }
    });
  }

  // --- Lógica de Previsualización (Visor) ---

  visualizarDocumento(doc: any): void {
    this.documentoEnVista = doc;
    if (doc) {
      if (this.esPdf(doc)) {
        this.safePreviewUrl = this.sanitizarUrl(doc.ruta);
      } else if (this.esOffice(doc)) {
        this.safePreviewUrl = this.sanitizarUrl('https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(doc.ruta));
      } else {
        this.safePreviewUrl = null;
      }
    } else {
      this.safePreviewUrl = null;
    }
    this.cdr.detectChanges();
  }

  cerrarPreview(): void {
    this.documentoEnVista = null;
    this.safePreviewUrl = null;
    this.cdr.detectChanges();
  }

  // --- Lógica de Menú Contextual (Click Derecho) ---

  abrirMenuContextual(event: MouseEvent, docAssoc: any): void {
    event.preventDefault();
    this.documentoSeleccionadoContextual = docAssoc;
    this.menuContextualPosicion = {
      x: `${event.clientX}px`,
      y: `${event.clientY}px`
    };
    this.menuContextualVisible = true;
  }

  cerrarMenuContextual(): void {
    this.menuContextualVisible = false;
  }

  verDetalleDocumento(): void {
    if (this.documentoSeleccionadoContextual && this.documentoSeleccionadoContextual.documento) {
      this.router.navigate([`/documentos/detalle/${this.documentoSeleccionadoContextual.documento.id}`]);
    }
    this.cerrarMenuContextual();
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

  esPdf(doc: any): boolean {
    return doc && doc.formato === 'PDF';
  }

  esOffice(doc: any): boolean {
    return doc && (doc.formato === 'DOCX' || doc.formato === 'EXCEL');
  }

  esPrevisualizable(doc: any): boolean {
    return this.esImagen(doc) || this.esVideo(doc) || this.esPdf(doc) || this.esOffice(doc);
  }

  sanitizarUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  encodeURIComponent(val: string): string {
    return encodeURIComponent(val);
  }

  // --- Lógica del Lienzo Editor y Firmador ---

  onSeleccionarPlantilla(): void {
    const p = this.plantillasDisponibles.find(x => x.id == this.docSubir.plantillaId);
    if (p) {
      const lastDot = p.nombre.lastIndexOf('.');
      this.docSubir.nombre = lastDot > 0 ? p.nombre.substring(0, lastDot) : p.nombre;
      this.cdr.detectChanges();
    }
  }

  abrirEditorLienzoConPlantilla(): void {
    const p = this.plantillasDisponibles.find(x => x.id == this.docSubir.plantillaId);
    if (!p) {
      this.alerta.advertencia("Por favor seleccione una plantilla válida.");
      return;
    }

    this.lienzoNombreDoc = this.docSubir.nombre || p.nombre;
    this.lienzoEstadoDoc = this.docSubir.estado || 'FALTAN_FIRMAS';
    this.elementosLienzo = [];
    this.contadorIdElemento = 0;
    this.lienzoEdicionRelacionId = null;
    
    this.mostrarModalSubir = false;
    this.mostrarEditorLienzo = true;
    this.cargandoLienzo = true;
    this.cdr.detectChanges();

    this.documentosService.descargarDocumentoAsBlob(p.id).subscribe({
      next: (blob) => {
        const localBlobUrl = URL.createObjectURL(blob);
        this.activeBlobUrls.push(localBlobUrl);
        
        if (p.formato === 'PDF') {
          this.renderizarPdfEnLienzo(localBlobUrl);
        } else {
          this.inicializarImagenEnLienzo(localBlobUrl);
        }
      },
      error: (err) => {
        console.error("Error al descargar plantilla como blob:", err);
        this.alerta.error("No se pudo obtener el archivo de la plantilla.");
        this.cerrarLienzoEditor();
      }
    });
  }

  cerrarLienzoEditor(): void {
    this.mostrarEditorLienzo = false;
    this.backgroundLienzoUrl = '';
    this.elementosLienzo = [];
    this.cdr.detectChanges();
  }

  // --- Helpers de Renderizado de Fondo (PDF.js / Imagen) ---

  cargarPdfJs(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        resolve();
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  esperarElemento(id: string, maxIntentos = 30, intervalo = 50): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      let intentos = 0;
      const verificar = () => {
        const el = document.getElementById(id);
        if (el) {
          resolve(el);
        } else if (intentos >= maxIntentos) {
          reject(new Error(`Elemento #${id} no encontrado tras ${maxIntentos} intentos`));
        } else {
          intentos++;
          setTimeout(verificar, intervalo);
        }
      };
      verificar();
    });
  }

  async renderizarPdfEnLienzo(pdfUrl: string) {
    this.cargandoLienzo = true;
    this.esPdfLienzo = true;
    this.cdr.detectChanges();

    try {
      const canvas = await this.esperarElemento('canvas-pdf-bg') as HTMLCanvasElement;
      
      await this.cargarPdfJs();
      const pdfjsLib = (window as any).pdfjsLib;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error("No se pudo obtener el contexto 2D del canvas");
      }

      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const desiredWidth = 650;
      
      // Calcular dimensiones de cada página y la altura total
      const pagesInfo = [];
      let totalHeight = 0;

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewportDefault = page.getViewport({ scale: 1.0 });
        const scale = desiredWidth / viewportDefault.width;
        const viewport = page.getViewport({ scale: scale });
        
        pagesInfo.push({
          page,
          viewport,
          height: viewport.height
        });
        totalHeight += viewport.height;
      }

      // Configurar tamaño del canvas y del contenedor
      canvas.width = desiredWidth;
      canvas.height = totalHeight;

      const container = document.getElementById('lienzo-captura-container');
      if (container) {
        container.style.width = desiredWidth + 'px';
        container.style.height = totalHeight + 'px';
      }

      // Limpiar el canvas antes de dibujar
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Dibujar cada página con su desplazamiento vertical (y-offset)
      let currentYOffset = 0;
      for (const pInfo of pagesInfo) {
        context.save();
        context.translate(0, currentYOffset);
        
        await pInfo.page.render({ 
          canvasContext: context, 
          viewport: pInfo.viewport 
        }).promise;
        
        context.restore();
        currentYOffset += pInfo.height;
      }

      this.cargandoLienzo = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error("Error al renderizar PDF en lienzo:", error);
      this.alerta.error("No se pudo renderizar el PDF de la plantilla.");
      this.cargandoLienzo = false;
      this.esPdfLienzo = false;
      this.cdr.detectChanges();
    }
  }

  async inicializarImagenEnLienzo(imageUrl: string) {
    this.esPdfLienzo = false;
    this.cargandoLienzo = true;
    this.cdr.detectChanges();
    
    try {
      const container = await this.esperarElemento('lienzo-captura-container');
      this.backgroundLienzoUrl = imageUrl;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      img.onload = () => {
        const desiredWidth = 650;
        const scale = desiredWidth / img.width;
        const height = img.height * scale;
        
        container.style.width = desiredWidth + 'px';
        container.style.height = height + 'px';

        this.cargandoLienzo = false;
        this.cdr.detectChanges();
      };
      img.onerror = () => {
        this.cargandoLienzo = false;
        this.alerta.error("No se pudo cargar la imagen de la plantilla.");
        this.cdr.detectChanges();
      };
    } catch (error) {
      console.error("Error al inicializar imagen en lienzo:", error);
      this.alerta.error("Error al inicializar el lienzo.");
      this.cargandoLienzo = false;
      this.cdr.detectChanges();
    }
  }

  // --- Elementos del Lienzo (Texto / Firma) ---

  agregarTextoAlLienzo(): void {
    const workspace = document.querySelector('.canvas-editor-workspace');
    const container = document.getElementById('lienzo-captura-container');
    
    let targetX = 225; // (650 / 2) - (200 / 2)
    let targetY = 100;
    
    if (workspace) {
      const workspaceHeight = workspace.clientHeight;
      const scrollTop = workspace.scrollTop;
      const itemHeight = 60;
      
      let calculatedY = scrollTop + (workspaceHeight / 2) - (itemHeight / 2);
      
      if (container) {
        const containerHeight = container.clientHeight;
        if (calculatedY < 20) {
          calculatedY = 20;
        }
        if (calculatedY > containerHeight - itemHeight - 20) {
          calculatedY = Math.max(20, containerHeight - itemHeight - 20);
        }
      }
      targetY = calculatedY;
    }

    this.contadorIdElemento++;
    const nuevoElemento = {
      id: this.contadorIdElemento,
      tipo: 'texto' as 'texto' | 'firma',
      x: targetX,
      y: targetY,
      ancho: 200,
      alto: 60,
      contenido: 'Doble clic para editar texto',
      seleccionado: true,
      editando: false
    };
    
    this.deseleccionarTodosLosElementos();
    this.elementosLienzo.push(nuevoElemento);
    this.cdr.detectChanges();
  }

  eliminarElementoLienzo(event: MouseEvent, item: any): void {
    event.stopPropagation();
    this.elementosLienzo = this.elementosLienzo.filter(x => x.id !== item.id);
    this.cdr.detectChanges();
  }

  editarTextoLienzo(item: any): void {
    item.editando = true;
    this.cdr.detectChanges();
  }

  guardarEdicionTexto(item: any): void {
    item.editando = false;
    if (!item.contenido || item.contenido.trim() === '') {
      this.elementosLienzo = this.elementosLienzo.filter(x => x.id !== item.id);
    }
    this.cdr.detectChanges();
  }

  deseleccionarTodosLosElementos(): void {
    this.elementosLienzo.forEach(x => {
      x.seleccionado = false;
      x.editando = false;
    });
  }

  // --- Drag & Drop y Resize en Lienzo (Angular Mouse Events) ---

  iniciarArrastre(event: MouseEvent, item: any): void {
    if (item.editando) return;
    event.preventDefault();
    event.stopPropagation();
    this.deseleccionarTodosLosElementos();
    item.seleccionado = true;
    
    this.elementoArrastrando = item;
    this.dragOffsetX = event.clientX - item.x;
    this.dragOffsetY = event.clientY - item.y;
    this.cdr.detectChanges();
  }

  iniciarRedimension(event: MouseEvent, item: any): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.elementoRedimensionando = item;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.resizeStartWidth = item.ancho;
    this.resizeStartHeight = item.alto;
    this.cdr.detectChanges();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMoveLienzo(event: MouseEvent): void {
    if (this.elementoArrastrando) {
      let newX = event.clientX - this.dragOffsetX;
      let newY = event.clientY - this.dragOffsetY;
      
      const container = document.getElementById('lienzo-captura-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const maxLimitX = rect.width - this.elementoArrastrando.ancho;
        const maxLimitY = rect.height - this.elementoArrastrando.alto;
        if (newX < 0) newX = 0;
        if (newX > maxLimitX) newX = maxLimitX;
        if (newY < 0) newY = 0;
        if (newY > maxLimitY) newY = maxLimitY;
      }
      
      this.elementoArrastrando.x = newX;
      this.elementoArrastrando.y = newY;
      this.cdr.detectChanges();
    }
    
    if (this.elementoRedimensionando) {
      const diffX = event.clientX - this.resizeStartX;
      const diffY = event.clientY - this.resizeStartY;
      
      let newW = this.resizeStartWidth + diffX;
      let newH = this.resizeStartHeight + diffY;
      
      if (newW < 50) newW = 50;
      if (newH < 30) newH = 30;
      
      this.elementoRedimensionando.ancho = newW;
      this.elementoRedimensionando.alto = newH;
      this.cdr.detectChanges();
    }
  }

  @HostListener('document:mouseup')
  onMouseUpLienzo(): void {
    this.elementoArrastrando = null;
    this.elementoRedimensionando = null;
  }

  // --- Signature Pad Modales y Canvas ---

  abrirSignaturePad(): void {
    this.mostrarSignaturePad = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.limpiarFirma();
    }, 100);
  }

  cerrarSignaturePad(): void {
    this.mostrarSignaturePad = false;
    this.cdr.detectChanges();
  }

  startDrawing(event: MouseEvent): void {
    this.sigDrawing = true;
    const canvas = document.getElementById('canvas-firma-pad') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    this.sigLastX = event.clientX - rect.left;
    this.sigLastY = event.clientY - rect.top;
  }

  draw(event: MouseEvent): void {
    if (!this.sigDrawing) return;
    const canvas = document.getElementById('canvas-firma-pad') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    
    const currX = event.clientX - rect.left;
    const currY = event.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(this.sigLastX, this.sigLastY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    this.sigLastX = currX;
    this.sigLastY = currY;
  }

  stopDrawing(): void {
    this.sigDrawing = false;
  }

  startDrawingTouch(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.sigDrawing = true;
      const canvas = document.getElementById('canvas-firma-pad') as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      this.sigLastX = touch.clientX - rect.left;
      this.sigLastY = touch.clientY - rect.top;
      event.preventDefault();
    }
  }

  drawTouch(event: TouchEvent): void {
    if (!this.sigDrawing || event.touches.length !== 1) return;
    const canvas = document.getElementById('canvas-firma-pad') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    
    const currX = touch.clientX - rect.left;
    const currY = touch.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(this.sigLastX, this.sigLastY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    this.sigLastX = currX;
    this.sigLastY = currY;
    event.preventDefault();
  }

  limpiarFirma(): void {
    const canvas = document.getElementById('canvas-firma-pad') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  aceptarFirmaDibujada(): void {
    const canvas = document.getElementById('canvas-firma-pad') as HTMLCanvasElement;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    
    const workspace = document.querySelector('.canvas-editor-workspace');
    const container = document.getElementById('lienzo-captura-container');
    
    let targetX = 250; // (650 / 2) - (150 / 2)
    let targetY = 150;
    
    if (workspace) {
      const workspaceHeight = workspace.clientHeight;
      const scrollTop = workspace.scrollTop;
      const itemHeight = 75;
      
      let calculatedY = scrollTop + (workspaceHeight / 2) - (itemHeight / 2);
      
      if (container) {
        const containerHeight = container.clientHeight;
        if (calculatedY < 20) {
          calculatedY = 20;
        }
        if (calculatedY > containerHeight - itemHeight - 20) {
          calculatedY = Math.max(20, containerHeight - itemHeight - 20);
        }
      }
      targetY = calculatedY;
    }

    this.contadorIdElemento++;
    const nuevoElementoFirma = {
      id: this.contadorIdElemento,
      tipo: 'firma' as 'texto' | 'firma',
      x: targetX,
      y: targetY,
      ancho: 150,
      alto: 75,
      contenido: dataUrl,
      seleccionado: true,
      editando: false
    };
    
    this.deseleccionarTodosLosElementos();
    this.elementosLienzo.push(nuevoElementoFirma);
    this.mostrarSignaturePad = false;
    this.cdr.detectChanges();
  }

  // --- Exportar y Guardar Lienzo en GCS ---

  guardarLienzo(): void {
    if (!this.lienzoNombreDoc || !this.lienzoNombreDoc.trim()) {
      this.alerta.advertencia("Por favor escriba un nombre para el documento.");
      return;
    }

    const container = document.getElementById('lienzo-captura-container');
    if (!container) {
      this.alerta.error("No se pudo encontrar el contenedor de captura.");
      return;
    }

    this.cargandoLienzo = true;
    this.cdr.detectChanges();

    this.deseleccionarTodosLosElementos();
    this.cdr.detectChanges();

    setTimeout(() => {
      html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            this.alerta.error("No se pudo compilar el lienzo.");
            this.cargandoLienzo = false;
            this.cdr.detectChanges();
            return;
          }

          const nombreArchivo = `${this.lienzoNombreDoc.trim()}.png`;
          const file = new File([blob], nombreArchivo, { type: 'image/png' });

          const request = this.lienzoEdicionRelacionId
            ? this.documentosService.actualizarIncidenciaDocumento(this.lienzoEdicionRelacionId, file, this.lienzoEstadoDoc, this.lienzoNombreDoc.trim())
            : this.documentosService.subirParaIncidencia(this.idIncidencia, file, this.lienzoEstadoDoc, this.lienzoNombreDoc.trim());

          request.subscribe({
            next: () => {
              this.cargandoLienzo = false;
              this.mostrarEditorLienzo = false;
              this.alerta.exito(this.lienzoEdicionRelacionId ? "Documento actualizado correctamente." : "Documento firmado y guardado correctamente.");
              this.cargarDocumentosAsociados();
            },
            error: (err) => {
              this.cargandoLienzo = false;
              this.cdr.detectChanges();
              this.alerta.error("Error al guardar el documento: " + (err.error || err.message));
            }
          });

        }, 'image/png');
      }).catch((err) => {
        console.error("Error al capturar lienzo:", err);
        this.alerta.error("Error al procesar el lienzo de firma.");
        this.cargandoLienzo = false;
        this.cdr.detectChanges();
      });
    }, 150);
  }

  // --- Selección de Edición de Documento Existente ---

  irAEdicionMetadatos(): void {
    this.seccionEdicion = 'METADATOS';
    this.cdr.detectChanges();
  }

  abrirEditorLienzoConDocumentoExistente(): void {
    const relacion = this.docEditar.relacionOriginal;
    if (!relacion) return;

    this.lienzoEdicionRelacionId = relacion.id;
    this.lienzoNombreDoc = relacion.documento.nombre;
    this.lienzoEstadoDoc = relacion.estado;
    this.elementosLienzo = [];
    this.contadorIdElemento = 0;
    
    this.mostrarModalEditar = false;
    this.mostrarEditorLienzo = true;
    this.cargandoLienzo = true;
    this.cdr.detectChanges();

    this.documentosService.descargarDocumentoAsBlob(relacion.documento.id).subscribe({
      next: (blob) => {
        const localBlobUrl = URL.createObjectURL(blob);
        this.activeBlobUrls.push(localBlobUrl);
        
        if (relacion.documento.formato === 'PDF') {
          this.renderizarPdfEnLienzo(localBlobUrl);
        } else {
          this.inicializarImagenEnLienzo(localBlobUrl);
        }
      },
      error: (err) => {
        console.error("Error al descargar documento existente como blob:", err);
        this.alerta.error("No se pudo obtener el archivo del documento.");
        this.cerrarLienzoEditor();
      }
    });
  }

  // --- Buscador y Filtro de Plantillas ---

  filtrarPlantillas(): void {
    const q = this.busquedaPlantilla.toLowerCase().trim();
    if (!q) {
      this.plantillasFiltradas = [...this.plantillasDisponibles];
    } else {
      this.plantillasFiltradas = this.plantillasDisponibles.filter(p => 
        p.nombre.toLowerCase().includes(q)
      );
    }
  }

  toggleDropdownPlantillas(): void {
    this.mostrarDropdownPlantillas = !this.mostrarDropdownPlantillas;
    if (this.mostrarDropdownPlantillas) {
      this.filtrarPlantillas();
    }
  }

  seleccionarPlantillaDesdeDropdown(p: any): void {
    this.docSubir.plantillaId = p.id;
    this.busquedaPlantilla = p.nombre;
    this.mostrarDropdownPlantillas = false;
    this.onSeleccionarPlantilla();
  }

  cerrarDropdownRetardado(): void {
    setTimeout(() => {
      this.mostrarDropdownPlantillas = false;
      this.cdr.detectChanges();
    }, 250);
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
}
