import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EstadoGlobalService } from '../../servicios/global-service';
import { VisitasService } from '../../servicios/visitas-service';
import { IncidenciasService } from '../../servicios/incidencias-service';
import { AuthService, LoginRespuesta } from '../../servicios/auth-service';
import { EnumService } from '../../servicios/enum-service';
import { AlertaService } from '../../servicios/alerta-service';
import { IncidenciasRespuesta } from '../../modelos/incidencias.model';
import { VisitasDto } from '../../modelos/visitas.model';
import { PermisosService } from '../../servicios/permisos.service';

@Component({
  selector: 'app-importar-visitas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importar-visitas.html',
  styleUrl: './importar-visitas.scss'
})
export class ImportarVisitasComponent implements OnInit {

  promocionId: number | null = null;
  incidencias: IncidenciasRespuesta[] = [];
  tecnicos: LoginRespuesta[] = [];
  estados: any[] = [];
  cargando = false;

  modoEdicion = false;
  idVisitaEdicion: number | null = null;

  nuevaVisita: any = {
    idIncidencia: null,
    idTecnico: null,
    diaVisita: '',
    estadoVisita: '',
    observaciones: ''
  };

  constructor(
    private estadoGlobal: EstadoGlobalService,
    private visitasService: VisitasService,
    private incidenciasService: IncidenciasService,
    private authService: AuthService,
    private enumService: EnumService,
    private alerta: AlertaService,
    private router: Router,
    private route: ActivatedRoute,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeInsertarEditarIncidencias()) {
      this.router.navigate(['/visitas']);
      return;
    }

    this.estadoGlobal.promocion$.subscribe((id) => {
      this.promocionId = id;
      if (id !== null) {
        this.cargarIncidencias();
      }
    });

    this.cargarTecnicos();
    this.cargarEnums();

    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.modoEdicion = true;
      this.idVisitaEdicion = Number(id);
      this.cargarDatosVisitaEdicion();
    }
  }

  cargarDatosVisitaEdicion(): void {
    if (this.idVisitaEdicion === null) return;
    this.visitasService.obtenerPorId(this.idVisitaEdicion).subscribe({
      next: (res) => {
        let keyEstado = '';
        if (res.estadoVisita) {
          const match = this.estados.find(e => e.descripcion === res.estadoVisita);
          if (match) {
            keyEstado = match.value;
          } else {
            keyEstado = res.estadoVisita;
          }
        }

        let tecnicoId = null;
        if (res.tecnicoNombre) {
          const matchT = this.tecnicos.find(t => t.nombre === res.tecnicoNombre || t.username === res.tecnicoNombre);
          if (matchT) {
            tecnicoId = matchT.id;
          }
        }

        this.nuevaVisita = {
          idIncidencia: res.idIncidencia || null,
          idTecnico: tecnicoId,
          diaVisita: res.diaVisita ? new Date(res.diaVisita).toISOString().slice(0, 16) : '',
          estadoVisita: keyEstado,
          observaciones: res.observaciones || ''
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar visita para edición:", err)
    });
  }

  cargarIncidencias(): void {
    if (this.promocionId === null) return;
    this.incidenciasService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.incidencias = res;
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Error al cargar incidencias:", err)
    });
  }

  cargarTecnicos(): void {
    this.authService.getTecnicos().subscribe({
      next: (res) => {
        this.tecnicos = res;
        this.cdr.detectChanges(); 
        if (this.modoEdicion) {
          this.cargarDatosVisitaEdicion(); 
        }
      },
      error: (err) => console.error("Error al cargar técnicos:", err)
    });
  }

  cargarEnums(): void {
    this.enumService.obtenerTodosLosEnums().subscribe({
      next: (res) => {
        this.estados = res.estadosVisita || [];
        this.cdr.detectChanges(); 
        if (this.modoEdicion) {
          this.cargarDatosVisitaEdicion(); 
        }
      },
      error: (err) => console.error("Error al cargar enums de visita:", err)
    });
  }

  guardar(): void {
    if (!this.nuevaVisita.idIncidencia || !this.nuevaVisita.idTecnico || !this.nuevaVisita.diaVisita) {
      this.alerta.advertencia("Por favor complete los campos requeridos (Incidencia, Técnico y Fecha Visita).");
      return;
    }

    this.cargando = true;
    this.guardarConIdTecnico(Number(this.nuevaVisita.idTecnico));
  }

  guardarConIdTecnico(idTecnico: number): void {
    const fecha = new Date(this.nuevaVisita.diaVisita).toISOString().split('.')[0];

    const dto: VisitasDto = {
      idTecnico: idTecnico,
      idIncidencia: Number(this.nuevaVisita.idIncidencia),
      diaVisita: fecha,
      estadoVisita: this.nuevaVisita.estadoVisita || null,
      observaciones: this.nuevaVisita.observaciones || null
    };

    const operacion = this.modoEdicion && this.idVisitaEdicion !== null
      ? this.visitasService.actualizar(this.idVisitaEdicion, dto)
      : this.visitasService.insertar(dto);

    operacion.subscribe({
      next: () => {
        this.cargando = false;
        this.alerta.exito(this.modoEdicion ? "Visita técnica actualizada con éxito." : "Visita técnica registrada con éxito.");
        this.router.navigate(['/visitas']);
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al guardar visita: " + (err.error || err.message));
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/visitas']);
  }
}
