import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DocumentosService } from '../../servicios/documentos-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PermisosService } from '../../servicios/permisos.service';
import { TablaDatosComponent } from '../../utils/tabla-datos/tabla-datos';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-plantillas',
  standalone: true,
  imports: [CommonModule, FormsModule, TablaDatosComponent, RouterLink],
  templateUrl: './plantillas.html',
  styleUrl: './plantillas.scss'
})
export class PlantillasComponent implements OnInit {

  documentos: any[] = [];
  documentosFiltrados: any[] = [];
  cargando = false;
  mostrarMenuFiltros = false;

  filtroNombre = '';
  filtroFormato = '';

  documentoEnVista: any = null;
  safePreviewUrl: SafeResourceUrl | null = null;

  formatosDisponibles = [
    { value: 'DOCX', label: 'Word (DOCX)' },
    { value: 'EXCEL', label: 'Excel (XLSX)' },
    { value: 'PDF', label: 'PDF' },
    { value: 'IMAGEN', label: 'Imagen' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'OTRO', label: 'Otros' }
  ];

  config = {
    idCampo: 'id',
    idNombre: 'ID',
    mostrarId: true,
    columnas: [
      { campo: 'nombre', nombre: 'Nombre del Documento' },
      { campo: 'fechaText', nombre: 'Fecha de Carga' },
      { campo: 'formato', nombre: 'Formato' },
      { campo: 'visualizar', nombre: 'Vista Previa' }
    ]
  };

  constructor(
    private documentosService: DocumentosService,
    private alertaService: AlertaService,
    private router: Router,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeVerPlantillas()) {
      this.router.navigate(['/']);
      return;
    }
    this.cargarDocumentos();
  }

  cargarDocumentos(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.documentosService.listar().subscribe({
      next: (res) => {
        this.cargando = false;
        // Filtrar para mostrar únicamente las de tipo 'PLANTILLA'
        this.documentos = (res || [])
          .filter(d => d.tipoDocumento === 'PLANTILLA')
          .map(d => ({
            ...d,
            fechaText: this.formatearFecha(d.fechaMontado),
            visualizar: '' // campo de control para la columna de botón
          }));
        this.aplicarFiltros();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.alertaService.error("Error al obtener la lista de plantillas: " + (err.error || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    this.documentosFiltrados = this.documentos.filter(d => {
      const matchNombre = !this.filtroNombre.trim() || (d.nombre && d.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase()));
      const matchFormato = !this.filtroFormato || d.formato === this.filtroFormato;
      return matchNombre && matchFormato;
    });
    this.cdr.detectChanges();
  }

  toggleMenuFiltros(): void {
    this.mostrarMenuFiltros = !this.mostrarMenuFiltros;
    this.cdr.detectChanges();
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroFormato = '';
    this.aplicarFiltros();
  }

  irAlDetalle(row: any): void {
    this.router.navigate([`/plantillas/detalle/${row.id}`]);
  }

  editarDocumento(row: any): void {
    this.router.navigate([`/plantillas/detalle/${row.id}`]);
  }

  eliminarDocumento(row: any): void {
    if (!row || !row.id) return;

    this.alertaService.confirmar(
      "¿Eliminar Plantilla?", 
      `¿Está seguro de que desea eliminar la plantilla "${row.nombre}"? Esto también eliminará el archivo de Google Cloud Storage.`,
      "Sí, eliminar"
    ).then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.cdr.detectChanges();
        this.documentosService.eliminar(row.id).subscribe({
          next: () => {
            this.alertaService.exito("Plantilla eliminada con éxito.");
            this.cargarDocumentos();
          },
          error: (err) => {
            this.cargando = false;
            this.cdr.detectChanges();
            this.alertaService.error("Error al eliminar la plantilla: " + (err.error || err.message));
          }
        });
      }
    });
  }

  // --- Lógica de Previsualización ---

  visualizarDocumento(row: any): void {
    this.documentoEnVista = row;
    if (row) {
      if (this.esPdf(row)) {
        this.safePreviewUrl = this.sanitizarUrl(row.ruta);
      } else if (this.esOffice(row)) {
        this.safePreviewUrl = this.sanitizarUrl('https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(row.ruta));
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

  esImagen(doc: any): boolean {
    return doc && doc.formato === 'IMAGEN';
  }

  esVideo(doc: any): boolean {
    return doc && doc.formato === 'VIDEO';
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

  private formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    try {
      const date = new Date(fechaStr);
      if (!isNaN(date.getTime())) {
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const anio = date.getFullYear();
        return `${dia}/${mes}/${anio}`;
      }
    } catch (e) {}
    return fechaStr;
  }
}
