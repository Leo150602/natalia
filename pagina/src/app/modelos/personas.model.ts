export interface PersonasDto {
  nombre: string;
  telefono: string;
  tipoPersonas: string;
  idPromotora?: number;
}

export interface PersonasRespuesta {
  idPersona: number;
  nombre: string;
  telefono: string;
  tipoPersonas: string;
  idPromotora?: number;
  nombrePromotora?: string;
}
