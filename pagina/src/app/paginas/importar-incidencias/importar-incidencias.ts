import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EstadoGlobalService } from '../../servicios/global-service';
import { IncidenciasService } from '../../servicios/incidencias-service';
import { PisosService } from '../../servicios/pisos-service';
import { EnumService } from '../../servicios/enum-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PisosRespuesta } from '../../modelos/pisos.model';
import { IncidenciasDto } from '../../modelos/incidencias.model';
import { PermisosService } from '../../servicios/permisos.service';

@Component({
  selector: 'app-importar-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importar-incidencias.html',
  styleUrl: './importar-incidencias.scss'
})
export class ImportarIncidenciasComponent implements OnInit {

  promocionId: number | null = null;
  pisos: PisosRespuesta[] = [];
  nuevoPisoNombre = '';
  placeholderNumeroIncidencia = 'Ej. INC-001';
  
  categorias: any[] = [];
  estados: any[] = [];
  horasLista: any[] = [];
  respuestasSNN: any[] = [
    { value: 'SI', descripcion: 'Sí' },
    { value: 'NO', descripcion: 'No' },
    { value: 'NA', descripcion: 'N/A' }
  ];

  modoEdicion = false;
  idIncidenciaEdicion: number | null = null;

  nuevaIncidencia: any = {
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

  constructor(
    private estadoGlobal: EstadoGlobalService,
    private incidenciasService: IncidenciasService,
    private pisosService: PisosService,
    private enumService: EnumService,
    private alerta: AlertaService,
    private router: Router,
    private route: ActivatedRoute,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (idParam) {
      this.idIncidenciaEdicion = Number(idParam);
      this.modoEdicion = true;
    }

    if (this.modoEdicion && !this.permisosService.puedeInsertarEditar()) {
      this.router.navigate(['/incidencias']);
      return;
    }

    this.estadoGlobal.promocion$.subscribe((id) => {
      this.promocionId = id;
      if (id !== null) {
        this.cargarPisos();
        this.cargarUltimoNumeroIncidencia();
      }
    });

    this.cargarEnums();
  }

  cargarDatosIncidenciaEdicion(): void {
    if (!this.idIncidenciaEdicion) return;
    this.incidenciasService.obtenerPorId(this.idIncidenciaEdicion).subscribe({
      next: (res) => {
        const catMatch = this.categorias.find(c => c.descripcion === res.categoria);
        const estMatch = this.estados.find(e => e.descripcion === res.estado);
        const horMatch = this.horasLista.find(h => h.descripcion === res.horas);
        const presMatch = this.respuestasSNN.find(r => r.descripcion === res.presupuesto);
        const profMatch = this.respuestasSNN.find(r => r.descripcion === res.proforma);

        this.nuevaIncidencia = {
          numeroIncidencia: res.numeroIncidencia,
          idPiso: res.pisos ? res.pisos.idPiso : null,
          categoriaIncidencia: catMatch ? catMatch.value : '',
          descripcionIncidencia: res.descripcion || '',
          observaciones: res.observacion || '',
          materialesRequeridos: res.materialesRequeridos || '',
          estadoIncidencia: estMatch ? estMatch.value : '',
          horasTrabajadas: horMatch ? horMatch.value : '',
          presupuesto: presMatch ? presMatch.value : '',
          proforma: profMatch ? profMatch.value : '',
          fechaIncidencia: res.fechaIncidencia ? new Date(res.fechaIncidencia).toISOString().slice(0, 16) : ''
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar incidencia para edición:", err)
    });
  }

  cargarPisos(): void {
    if (this.promocionId === null) return;
    this.pisosService.obtenerPorPromocion(this.promocionId).subscribe({
      next: (res) => {
        this.pisos = res;
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Error al cargar pisos:", err)
    });
  }

  cargarEnums(): void {
    this.enumService.obtenerTodosLosEnums().subscribe({
      next: (res) => {
        this.categorias = res.categorias || [];
        const rawEstados = res.estadosIncidencia || [];
        this.estados = rawEstados.filter((e: any) => e.value !== 'SOLICITADO' && e.value !== 'RECHAZADO');
        this.horasLista = res.horasTrabajadas || [];
        
        if (this.modoEdicion) {
          this.cargarDatosIncidenciaEdicion();
        }
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Error al cargar enums:", err)
    });
  }

  cargarUltimoNumeroIncidencia(): void {
    if (this.promocionId === null) {
      this.placeholderNumeroIncidencia = 'Ej. INC-001';
      return;
    }
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
            this.placeholderNumeroIncidencia = `ultima incidencia: ${maxIncidenciaStr}`;
          } else {
            this.placeholderNumeroIncidencia = 'Ej. INC-001';
          }
        } else {
          this.placeholderNumeroIncidencia = 'Ej. INC-001';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al obtener incidencias para sugerencia:", err);
        this.placeholderNumeroIncidencia = 'Ej. INC-001';
      }
    });
  }

  guardar(): void {
    if (!this.nuevaIncidencia.numeroIncidencia || !this.nuevaIncidencia.idPiso) {
      this.alerta.advertencia("Por favor rellene los campos obligatorios (Nº Incidencia y Piso).");
      return;
    }

    this.cargando = true;

    if (this.nuevaIncidencia.idPiso === 'nuevo') {
      if (!this.nuevoPisoNombre || !this.nuevoPisoNombre.trim()) {
        this.alerta.advertencia("Por favor indique el nombre del nuevo piso.");
        this.cargando = false;
        return;
      }
      this.pisosService.insertar({
        piso: this.nuevoPisoNombre.trim().toUpperCase(),
        idPromocion: this.promocionId!,
        propietarioNombre: null,
        propietarioTelefono: null
      }).subscribe({
        next: (createdFloor) => {
          this.guardarConIdPiso(createdFloor.idPiso);
        },
        error: (err) => {
          this.cargando = false;
          this.cdr.detectChanges();
          this.alerta.error("Error al crear el nuevo piso: " + (err.error || err.message));
        }
      });
    } else {
      this.guardarConIdPiso(Number(this.nuevaIncidencia.idPiso));
    }
  }

  guardarConIdPiso(idPiso: number): void {
    let fecha = null;
    if (this.nuevaIncidencia.fechaIncidencia) {
      fecha = new Date(this.nuevaIncidencia.fechaIncidencia).toISOString().split('.')[0];
    }

    const dto: IncidenciasDto = {
      numeroIncidencia: this.nuevaIncidencia.numeroIncidencia,
      categoriaIncidencia: this.nuevaIncidencia.categoriaIncidencia || null,
      descripcionIncidencia: this.nuevaIncidencia.descripcionIncidencia || null,
      observaciones: this.nuevaIncidencia.observaciones || null,
      materialesRequeridos: this.nuevaIncidencia.materialesRequeridos || null,
      estadoIncidencia: this.nuevaIncidencia.estadoIncidencia || null,
      horasTrabajadas: this.nuevaIncidencia.horasTrabajadas || null,
      presupuesto: this.nuevaIncidencia.presupuesto || null,
      proforma: this.nuevaIncidencia.proforma || null,
      idPiso: idPiso,
      fechaIncidencia: fecha
    };

    if (!this.modoEdicion && !this.permisosService.puedeInsertarEditar()) {
      dto.estadoIncidencia = 'SOLICITADO';
    }

    const operacion = this.modoEdicion && this.idIncidenciaEdicion
      ? this.incidenciasService.actualizar(this.idIncidenciaEdicion, dto)
      : this.incidenciasService.insertar(dto);

    operacion.subscribe({
      next: () => {
        this.cargando = false;
        this.alerta.exito(this.modoEdicion ? "Incidencia actualizada con éxito." : "Incidencia registrada con éxito.");
        if (this.permisosService.esCliente() || this.permisosService.esTecnico()) {
          this.router.navigate(['/']);
        } else {
          this.router.navigate(['/incidencias']);
        }
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al guardar la incidencia: " + (err.error || err.message));
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/incidencias']);
  }
}
