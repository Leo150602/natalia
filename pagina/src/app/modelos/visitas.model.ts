export interface VisitasDto {
  observaciones: string;
  diaVisita: string | Date;
  estadoVisita: string;
  idTecnico: number;
  idIncidencia: number;
}

export interface VisitasRespuesta {
  idVisita: number;
  observaciones: string;
  diaVisita: string | Date;
  estadoVisita: string;
  tecnicoNombre: string;
  tecnicoTelefono: string;
  numeroIncidencia: string;
  idIncidencia: number;
  piso: string;
  promocion: string;
  propietario?: string | null;
  telefonoPropietario?: string | null;
}
