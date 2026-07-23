import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EstadoGlobalService } from '../../servicios/global-service';
import { VisitasService } from '../../servicios/visitas-service';
import { IncidenciasService } from '../../servicios/incidencias-service';
import { PersonasService } from '../../servicios/personas-service';
import { EnumService } from '../../servicios/enum-service';
import { AlertaService } from '../../servicios/alerta-service';
import { IncidenciasRespuesta } from '../../modelos/incidencias.model';
import { PersonasRespuesta } from '../../modelos/personas.model';
import { VisitasDto } from '../../modelos/visitas.model';

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
  tecnicos: PersonasRespuesta[] = [];
  estados: any[] = [];
  cargando = false;

  // Campos para nuevo técnico inline
  nuevoTecnicoNombre = '';
  nuevoTecnicoTelefono = '';

  // Control de Edición
  modoEdicion = false;
  idVisitaEdicion: number | null = null;

  nuevaVisita: any = {
    numeroIncidencia: '',
    idTecnico: null,
    diaVisita: '',
    estadoVisita: '',
    observaciones: ''
  };

  constructor(
    private estadoGlobal: EstadoGlobalService,
    private visitasService: VisitasService,
    private incidenciasService: IncidenciasService,
    private personasService: PersonasService,
    private enumService: EnumService,
    private alerta: AlertaService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.estadoGlobal.promocion$.subscribe((id) => {
      this.promocionId = id;
      if (id !== null) {
        this.cargarIncidencias();
      }
    });

    this.cargarTecnicos();
    this.cargarEnums();

    // Comprobar si se ha pasado un ID para editar
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
          const matchT = this.tecnicos.find(t => t.nombre === res.tecnicoNombre);
          if (matchT) {
            tecnicoId = matchT.idPersona;
          }
        }

        this.nuevaVisita = {
          numeroIncidencia: res.numeroIncidencia || '',
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
        this.cdr.detectChanges(); // Forzar renderizado
      },
      error: (err) => console.error("Error al cargar incidencias:", err)
    });
  }

  cargarTecnicos(): void {
    this.personasService.obtenerTodas().subscribe({
      next: (res) => {
        this.tecnicos = res.filter(p => p.tipoPersonas === 'TECNICO');
        this.cdr.detectChanges(); // Forzar renderizado
        if (this.modoEdicion) {
          this.cargarDatosVisitaEdicion(); // Re-cargar para asegurar que coincidan los técnicos
        }
      },
      error: (err) => console.error("Error al cargar técnicos:", err)
    });
  }

  cargarEnums(): void {
    this.enumService.obtenerTodosLosEnums().subscribe({
      next: (res) => {
        this.estados = res.estadosVisita || [];
        this.cdr.detectChanges(); // Forzar renderizado
        if (this.modoEdicion) {
          this.cargarDatosVisitaEdicion(); // Re-cargar para asegurar que coincidan los enums
        }
      },
      error: (err) => console.error("Error al cargar enums de visita:", err)
    });
  }

  guardar(): void {
    if (!this.nuevaVisita.numeroIncidencia || !this.nuevaVisita.idTecnico || !this.nuevaVisita.diaVisita) {
      this.alerta.advertencia("Por favor complete los campos requeridos (Incidencia, Técnico y Fecha Visita).");
      return;
    }

    this.cargando = true;

    if (this.nuevaVisita.idTecnico === 'nuevo') {
      if (!this.nuevoTecnicoNombre || !this.nuevoTecnicoTelefono) {
        this.alerta.advertencia("Por favor indique el nombre y teléfono del nuevo técnico.");
        this.cargando = false;
        return;
      }
      this.personasService.insertar({
        nombre: this.nuevoTecnicoNombre.trim(),
        telefono: this.nuevoTecnicoTelefono.trim(),
        tipoPersonas: 'TECNICO'
      }).subscribe({
        next: (createdPersona) => {
          this.guardarConIdTecnico(createdPersona.idPersona);
        },
        error: (err) => {
          this.cargando = false;
          this.alerta.error("Error al registrar el técnico: " + (err.error || err.message));
        }
      });
    } else {
      this.guardarConIdTecnico(Number(this.nuevaVisita.idTecnico));
    }
  }

  guardarConIdTecnico(idTecnico: number): void {
    const fecha = new Date(this.nuevaVisita.diaVisita).toISOString().split('.')[0];

    const dto: VisitasDto = {
      idTecnico: idTecnico,
      numeroIncidencia: this.nuevaVisita.numeroIncidencia,
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
        this.alerta.error("Error al guardar visita: " + (err.error || err.message));
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/visitas']);
  }
}
