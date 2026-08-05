import { ColumnaTabla } from '../utils/tabla-datos/tabla-datos';

export interface ConfiguracionTabla {
  idCampo: string;
  idNombre: string;
  mostrarId: boolean;
  columnas: ColumnaTabla[];
}

export const CONFIG_TABLA_INCIDENCIAS: ConfiguracionTabla = {
  idCampo: 'numeroIncidencia',
  idNombre: 'Nº Incidencia',
  mostrarId: true, // Se muestra porque es el identificador de la incidencia
  columnas: [
    { campo: 'pisos.piso', nombre: 'Piso' },
    { campo: 'pisos.propietario', nombre: 'Propietario' },
    { campo: 'pisos.telefonoPropietario', nombre: 'Tel. Propietario' },
    { campo: 'categoria', nombre: 'Categoría' },
    { campo: 'descripcion', nombre: 'Descripción' },
    { campo: 'observacion', nombre: 'Observaciones' },
    { campo: 'estado', nombre: 'Estado' },
    { campo: 'horas', nombre: 'Horas Trabajadas' },
    { campo: 'presupuesto', nombre: 'Presupuesto' },
    { campo: 'proforma', nombre: 'Proforma' },
    { campo: 'fechaIncidencia', nombre: 'Fecha Incidencia' }
  ]
};

export const CONFIG_TABLA_VISITAS: ConfiguracionTabla = {
  idCampo: 'idVisitas',
  idNombre: 'ID Visita',
  mostrarId: false, // Oculto porque es un ID numérico autogenerado
  columnas: [
    { campo: 'numeroIncidencia', nombre: 'Nº Incidencia' },
    { campo: 'piso', nombre: 'Piso' },
    { campo: 'propietario', nombre: 'Propietario' },
    { campo: 'telefonoPropietario', nombre: 'Tel. Propietario' },
    { campo: 'tecnicoNombre', nombre: 'Técnico' },
    { campo: 'tecnicoTelefono', nombre: 'Tel. Técnico' },
    { campo: 'diaVisita', nombre: 'Fecha Visita' },
    { campo: 'estadoVisita', nombre: 'Estado' }
  ]
};

export const CONFIG_TABLA_PROMOCIONES: ConfiguracionTabla = {
  idCampo: 'idPromocion',
  idNombre: 'ID',
  mostrarId: false, // Oculto por ser ID surrogado
  columnas: [
    { campo: 'promocion', nombre: 'Promoción' },
    { campo: 'promotora', nombre: 'Promotora' },
    { campo: 'direccion', nombre: 'Dirección' }
  ]
};

export const CONFIG_TABLA_PROPIETARIOS: ConfiguracionTabla = {
  idCampo: 'telefono',
  idNombre: 'Teléfono',
  mostrarId: true,
  columnas: [
    { campo: 'nombre', nombre: 'Nombre Completo' }
  ]
};

export const CONFIG_TABLA_PISOS: ConfiguracionTabla = {
  idCampo: 'idPiso',
  idNombre: 'ID Piso',
  mostrarId: false, // Oculto por ser ID surrogado
  columnas: [
    { campo: 'piso', nombre: 'Piso' },
    { campo: 'propietario', nombre: 'Propietario' },
    { campo: 'telefonoPropietario', nombre: 'Tel. Propietario' }
  ]
};
