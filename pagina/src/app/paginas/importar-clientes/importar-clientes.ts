import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientesService } from '../../servicios/clientes-service';
import { PromotorasService } from '../../servicios/promotoras-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PermisosService } from '../../servicios/permisos.service';

@Component({
  selector: 'app-importar-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importar-clientes.html'
})
export class ImportarClientesComponent implements OnInit {
  username = '';
  password = '';
  nombre = '';
  telefono = '';
  correo = '';
  activo = true;
  cargando = false;
  promotorasList: any[] = [];
  idPromotora: number | null = null;

  modoEdicion = false;
  usuarioId: number | null = null;

  constructor(
    private clientesService: ClientesService,
    private promotorasService: PromotorasService,
    private alertaService: AlertaService,
    private router: Router,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeAdministrarClientes() || !this.permisosService.puedeInsertarEditar()) {
      this.router.navigate(['/clientes']);
      return;
    }

    this.cargarPromotoras();

    const state = history.state;
    if (state && state.clienteParaEditar) {
      const u = state.clienteParaEditar;
      this.modoEdicion = true;
      this.usuarioId = u.id;
      this.username = u.username || '';
      this.nombre = u.nombre || '';
      this.correo = u.correo || '';
      this.telefono = u.telefono || '';
      this.activo = u.activo !== false;
      this.idPromotora = u.idPromotora || null;
      this.password = '';
    }
  }

  cargarPromotoras(): void {
    this.promotorasService.obtenerTodas().subscribe({
      next: (data) => {
        this.promotorasList = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar promotoras:", err)
    });
  }

  guardar(): void {
    if (!this.username.trim() || !this.nombre.trim() || !this.idPromotora) {
      this.alertaService.advertencia("Por favor complete todos los campos obligatorios (Usuario, Nombre, Promotora).", "Campos Requeridos");
      return;
    }

    if (!this.modoEdicion && !this.password.trim()) {
      this.alertaService.advertencia("La contraseña es requerida para un nuevo registro.", "Campo Requerido");
      return;
    }

    if (this.password.trim() && this.password.length < 4) {
      this.alertaService.advertencia("La contraseña debe tener al menos 4 caracteres.", "Contraseña Débil");
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    const dto = {
      username: this.username.trim(),
      password: this.password,
      nombre: this.nombre.trim(),
      rol: 'CLIENTE',
      telefono: this.telefono.trim(),
      correo: this.correo.trim(),
      activo: this.activo,
      idPromotora: this.idPromotora
    };

    if (this.modoEdicion && this.usuarioId) {
      this.clientesService.actualizar(this.usuarioId, dto).subscribe({
        next: (res) => {
          this.cargando = false;
          this.cdr.detectChanges();
          
          if (res.succes) {
            this.alertaService.exito("Cliente actualizado con éxito.", "Cliente Modificado");
            this.router.navigate(['/clientes']);
          } else {
            this.alertaService.error(res.mensaje || "Error al actualizar el cliente.", "Fallo de Guardado");
          }
        },
        error: (err) => {
          this.cargando = false;
          this.alertaService.error("Error al actualizar: " + (err.error?.mensaje || err.error || err.message), "Error");
          this.cdr.detectChanges();
        }
      });
    } else {
      this.clientesService.insertar(dto).subscribe({
        next: (res) => {
          this.cargando = false;
          this.cdr.detectChanges();
          
          if (res.succes) {
            this.alertaService.exito("Cliente creado con éxito.", "Registro Completado");
            this.router.navigate(['/clientes']);
          } else {
            this.alertaService.error(res.mensaje || "Error al crear el cliente.", "Fallo de Registro");
          }
        },
        error: (err) => {
          this.cargando = false;
          this.alertaService.error("Error al registrar: " + (err.error?.mensaje || err.error || err.message), "Error");
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }
}
