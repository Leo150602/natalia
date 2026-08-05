import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

export interface ColumnaTabla {
  campo: string;
  nombre: string;
}

@Component({
  selector: 'app-tabla-datos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './tabla-datos.html',
  styleUrl: './tabla-datos.scss',
})
export class TablaDatosComponent implements OnChanges, AfterViewInit {
  @Input() datos: any[] = [];
  @Input() columnas: ColumnaTabla[] = [];
  @Input() mostrarId: boolean = false;
  @Input() idCampo: string = '';
  @Input() idNombre: string = 'ID';
  @Input() permitirAcciones: boolean = true; // Por defecto habilita editar/eliminar
  @Input() cargando: boolean = false;
  @Input() etiquetaEditar: string = 'Actualizar';
  @Input() etiquetaEliminar: string = 'Eliminar';
  @Input() iconoEditar: string = '✏️';
  @Input() iconoEliminar: string = '🗑️';
  @Input() seleccionable: boolean = false;

  @Output() editar = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<any>();
  @Output() seleccionCambiada = new EventEmitter<any[]>();

  columnasVisibles: string[] = [];
  dataSource = new MatTableDataSource<any>([]);
  elementosSeleccionados: any[] = [];

  // Estados del menú contextual
  menuContextualVisible = false;
  menuContextualPosicion = { x: '0px', y: '0px' };
  filaSeleccionada: any = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datos']) {
      this.dataSource.data = this.datos || [];
      this.elementosSeleccionados = [];
      this.seleccionCambiada.emit([]);
    }
    if (changes['columnas'] || changes['mostrarId'] || changes['idCampo'] || changes['seleccionable']) {
      this.actualizarColumnasVisibles();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  actualizarColumnasVisibles(): void {
    let campos = this.columnas.map(c => c.campo);

    if (this.mostrarId && this.idCampo) {
      if (!campos.includes(this.idCampo)) {
        this.columnasVisibles = [this.idCampo, ...campos];
      } else {
        this.columnasVisibles = campos;
      }
    } else {
      this.columnasVisibles = campos.filter(c => c !== this.idCampo);
    }

    if (this.seleccionable) {
      this.columnasVisibles = ['seleccion', ...this.columnasVisibles];
    }
  }

  columnasDinamicas(): string[] {
    return this.columnasVisibles.filter(col => col !== 'seleccion');
  }

  estaSeleccionado(element: any): boolean {
    return this.elementosSeleccionados.includes(element);
  }

  alternarSeleccion(element: any): void {
    const idx = this.elementosSeleccionados.indexOf(element);
    if (idx > -1) {
      this.elementosSeleccionados.splice(idx, 1);
    } else {
      this.elementosSeleccionados.push(element);
    }
    this.seleccionCambiada.emit([...this.elementosSeleccionados]);
  }

  estaTodoSeleccionado(): boolean {
    return this.datos && this.datos.length > 0 && this.elementosSeleccionados.length === this.datos.length;
  }

  alternarTodosSeleccionados(): void {
    if (this.estaTodoSeleccionado()) {
      this.elementosSeleccionados = [];
    } else {
      this.elementosSeleccionados = [...this.datos];
    }
    this.seleccionCambiada.emit([...this.elementosSeleccionados]);
  }

  obtenerNombreColumna(campo: string): string {
    if (campo === this.idCampo) {
      return this.idNombre;
    }
    const col = this.columnas.find(c => c.campo === campo);
    return col ? col.nombre : campo;
  }

  obtenerValorCelda(element: any, campo: string): any {
    if (!element) return '';
    let val;
    if (campo.includes('.')) {
      val = campo.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : '', element);
    } else {
      val = element[campo];
    }

    if ((campo === 'fechaIncidencia' || campo === 'diaVisita') && val) {
      try {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          const dia = String(date.getDate()).padStart(2, '0');
          const mes = String(date.getMonth() + 1).padStart(2, '0');
          const anio = date.getFullYear();
          return `${dia}/${mes}/${anio}`;
        }
      } catch (e) {}
    }
    return val;
  }

  // Lógica del menú contextual al hacer clic derecho
  abrirMenuContextual(event: MouseEvent, row: any): void {
    if (!this.permitirAcciones) return;
    event.preventDefault(); // Evitar el menú nativo del navegador
    this.filaSeleccionada = row;
    this.menuContextualPosicion = {
      x: `${event.clientX}px`,
      y: `${event.clientY}px`
    };
    this.menuContextualVisible = true;
  }

  cerrarMenuContextual(): void {
    this.menuContextualVisible = false;
  }

  onEditar(): void {
    this.editar.emit(this.filaSeleccionada);
    this.cerrarMenuContextual();
  }

  onEliminar(): void {
    this.eliminar.emit(this.filaSeleccionada);
    this.cerrarMenuContextual();
  }
}
