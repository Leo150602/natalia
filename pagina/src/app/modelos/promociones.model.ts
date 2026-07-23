export interface PromocionItem {
  idPromocion: number;
  nombre: string;
}

export interface PromocionesDto {
  promotora: string;
  promocion: string;
}

export interface PromocionesRespuesta {
  promotora: string;
  promocion: PromocionItem[];
}
