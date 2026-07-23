export interface PisosDto {
  piso: string;
  idPromocion: number;
  propietarioNombre?: string | null;
  propietarioTelefono?: string | null;
}

export interface PisosRespuesta {
  idPiso: number;
  promocion: string;
  promotora?: string | null;
  piso: string;
  propietario?: string | null;
  telefonoPropietario?: string | null;
}
