export interface PromocionItem {
  idPromocion: number;
  nombre: string;
  direccion?: string | null;
  coordenadas?: string | null;
  color?: string | null;
}

export interface PromocionesDto {
  promotora: string;
  promocion: string;
  direccion?: string | null;
  coordenadas?: string | null;
  color?: string | null;
}

export interface PromocionesRespuesta {
  promotora: string;
  promocion: PromocionItem[];
}
