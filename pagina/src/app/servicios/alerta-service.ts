import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertaService {

  exito(mensaje: string, titulo: string = '¡Éxito!'): void {
    Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'success',
      confirmButtonColor: '#4c70bf',
      background: '#1f2937',
      color: '#ffffff',
      customClass: {
        popup: 'swal-dark-popup'
      }
    });
  }

  error(mensaje: string, titulo: string = 'Error'): void {
    Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'error',
      confirmButtonColor: '#dc2626',
      background: '#1f2937',
      color: '#ffffff',
      customClass: {
        popup: 'swal-dark-popup'
      }
    });
  }

  advertencia(mensaje: string, titulo: string = 'Atención'): void {
    Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'warning',
      confirmButtonColor: '#d97706',
      background: '#1f2937',
      color: '#ffffff',
      customClass: {
        popup: 'swal-dark-popup'
      }
    });
  }

  confirmar(titulo: string, mensaje: string, botonConfirmar: string = 'Sí, eliminar'): Promise<boolean> {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#4b5563',
      confirmButtonText: botonConfirmar,
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#ffffff',
      customClass: {
        popup: 'swal-dark-popup'
      }
    }).then(result => {
      return result.isConfirmed;
    });
  }
}
