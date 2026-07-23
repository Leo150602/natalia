import { PisosRespuesta } from './pisos.model';

export interface IncidenciasDto {
  numeroIncidencia: string;
  categoriaIncidencia?: string | null;
  descripcionIncidencia?: string | null;
  observaciones?: string | null;
  materialesRequeridos?: string | null;
  estadoIncidencia?: string | null;
  horasTrabajadas?: string | null;
  presupuesto?: string | null;
  proforma?: string | null;
  idPiso: number;
  fechaIncidencia?: string | Date | null;
}

export interface IncidenciasRespuesta {
  numeroIncidencia: string;
  estado: string;
  pisos: PisosRespuesta;
  categoria: string;
  observacion: string;
  descripcion: string;
  materialesRequeridos: string;
  presupuesto: string;
  proforma: string;
  horas: string;
  fechaIncidencia: string | Date;
}

export interface IncidenciasFiltroDto {
  numeroIncidencia?: string | null;
  piso?: string | null;
  promocion?: string | null;
  fechaInicial?: string | Date | null;
  fechaFinal?: string | Date | null;
  estadoIncidencia?: string | null;
  categoriaIncidencia?: string | null;
}
