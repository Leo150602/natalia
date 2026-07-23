export interface VisitasDto {
  observaciones: string;
  diaVisita: string | Date;
  estadoVisita: string;
  idTecnico: number;
  numeroIncidencia: string;
}

export interface VisitasRespuesta {
  idVisita: number;
  observaciones: string;
  diaVisita: string | Date;
  estadoVisita: string;
  tecnicoNombre: string;
  tecnicoTelefono: string;
  numeroIncidencia: string;
  piso: string;
  promocion: string;
}
