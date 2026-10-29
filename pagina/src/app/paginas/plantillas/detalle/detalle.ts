import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DocumentosService } from '../../../servicios/documentos-service';
import { AlertaService } from '../../../servicios/alerta-service';
import { PermisosService } from '../../../servicios/permisos.service';

@Component({
  selector: 'app-detalle-plantilla',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss'
})
export class DetallePlantillaComponent implements OnInit {

  documentoId!: number;
  cargando = false;
  puedeEditar = false;
  modoCrear = false;
  esPlantilla = true;

  documento: any = {
    nombre: '',
    ruta: '',
    formato: '',
    fechaMontado: '',
    tipoDocumento: 'PLANTILLA'
  };

  archivoSeleccionado: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentosService: DocumentosService,
    private alertaService: AlertaService,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Check if this is a general document rather than a template
    this.esPlantilla = !this.router.url.includes('/documentos/');

    if (this.esPlantilla) {
      if (!this.permisosService.puedeVerPlantillas()) {
        this.router.navigate(['/plantillas']);
        return;
      }
      this.puedeEditar = this.permisosService.puedeInsertarEditar();
    } else {
      this.puedeEditar = this.permisosService.puedeInsertarEditarIncidencias();
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.cancelar();
      return;
    }

    if (idParam === 'nuevo') {
      this.modoCrear = true;
      if (!this.esPlantilla) {
        this.documento.tipoDocumento = 'INCIDENCIA';
      }
    } else {
      this.documentoId = Number(idParam);
      this.cargarDatosDocumento();
    }
  }

  cargarDatosDocumento(): void {
    this.cargando = true;
    this.documentosService.listar().subscribe({
      next: (res) => {
        const found = res.find(d => d.id === this.documentoId);
        if (found) {
          this.documento = { ...found };
        } else {
          this.alertaService.error(this.esPlantilla ? "No se pudo encontrar la plantilla especificada." : "No se pudo encontrar el documento especificado.");
          this.cancelar();
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar documento:", err);
        this.cargando = false;
        this.alertaService.error(this.esPlantilla ? "Error al obtener la información de la plantilla." : "Error al obtener la información del documento.");
        this.cancelar();
      }
    });
  }

  onArchivoSeleccionado(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (this.esPlantilla) {
        if (ext !== '.pdf' && ext !== '.docx' && ext !== '.doc') {
          this.alertaService.advertencia("Solo se permiten archivos en formato PDF o Word (.docx, .doc) para las plantillas.");
          return;
        }
      }
      this.archivoSeleccionado = file;
      if (!this.documento.nombre || this.documento.nombre.trim() === '') {
        const lastDot = file.name.lastIndexOf('.');
        const nameWithoutExt = lastDot > 0 ? file.name.substring(0, lastDot) : file.name;
        this.documento.nombre = nameWithoutExt;
      }
      this.cdr.detectChanges();
    }
  }

  actualizar(): void {
    if (!this.documento.nombre || !this.documento.nombre.trim()) {
      this.alertaService.advertencia(this.esPlantilla ? "Por favor escriba un nombre para la plantilla." : "Por favor escriba un nombre para el documento.");
      return;
    }

    if (this.modoCrear && !this.archivoSeleccionado) {
      this.alertaService.advertencia(this.esPlantilla ? "Por favor seleccione un archivo para subir como plantilla." : "Por favor seleccione un archivo para subir como documento.");
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    if (this.modoCrear) {
      // Subir nueva plantilla o documento
      const tipo = this.esPlantilla ? 'PLANTILLA' : (this.documento.tipoDocumento || 'INCIDENCIA');
      this.documentosService.subir(this.archivoSeleccionado!, tipo, this.documento.nombre.trim()).subscribe({
        next: (res) => {
          this.cargando = false;
          this.alertaService.exito(this.esPlantilla ? "Plantilla subida con éxito." : "Documento subido con éxito.");
          this.cancelar();
        },
        error: (err) => {
          this.cargando = false;
          this.cdr.detectChanges();
          this.alertaService.error(this.esPlantilla ? ("Error al subir plantilla: " + (err.error || err.message)) : ("Error al subir documento: " + (err.error || err.message)));
        }
      });
    } else {
      // Editar plantilla o documento
      const fileToUpload = this.archivoSeleccionado || undefined;
      this.documentosService.actualizar(this.documentoId, fileToUpload, this.documento.nombre.trim()).subscribe({
        next: (res) => {
          this.cargando = false;
          this.alertaService.exito(this.esPlantilla ? "Plantilla actualizada con éxito." : "Documento actualizado con éxito.");
          this.cancelar();
        },
        error: (err) => {
          this.cargando = false;
          this.cdr.detectChanges();
          this.alertaService.error(this.esPlantilla ? ("Error al actualizar la plantilla: " + (err.error || err.message)) : ("Error al actualizar el documento: " + (err.error || err.message)));
        }
      });
    }
  }

  eliminar(): void {
    const titulo = this.esPlantilla ? "¿Eliminar Plantilla?" : "¿Eliminar Documento?";
    const mensaje = this.esPlantilla 
      ? `¿Está seguro de que desea eliminar la plantilla "${this.documento.nombre}"? Esto también eliminará el archivo en Google Cloud Storage.`
      : `¿Está seguro de que desea eliminar el documento "${this.documento.nombre}"? Esto también eliminará el archivo en Google Cloud Storage.`;

    this.alertaService.confirmar(titulo, mensaje, "Sí, eliminar").then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.documentosService.eliminar(this.documentoId).subscribe({
          next: () => {
            this.cargando = false;
            this.alertaService.exito(this.esPlantilla ? "Plantilla eliminada con éxito." : "Documento eliminado con éxito.");
            this.cancelar();
          },
          error: (err) => {
            this.cargando = false;
            this.cdr.detectChanges();
            this.alertaService.error(this.esPlantilla ? ("Error al eliminar la plantilla: " + (err.error || err.message)) : ("Error al eliminar el documento: " + (err.error || err.message)));
          }
        });
      }
    });
  }

  cancelar(): void {
    if (this.esPlantilla) {
      this.router.navigate(['/plantillas']);
    } else {
      window.history.back();
    }
  }
}
