import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../servicios/auth-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PermisosService } from '../../servicios/permisos.service';
import { PromotorasService } from '../../servicios/promotoras-service';

@Component({
  selector: 'app-registro-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-usuarios.html',
  styleUrl: './registro-usuarios.scss'
})
export class RegistroUsuariosComponent implements OnInit {
  username = '';
  password = '';
  nombre = '';
  rol = '';
  telefono = '';
  correo = '';
  activo = true;
  cargando = false;
  promotorasList: any[] = [];
  idPromotora: number | null = null;
  verPassword = false;

  modoEdicion = false;
  usuarioId: number | null = null;

  rolesDisponibles = [
    { value: 'ADMINISTRADOR', label: 'Administrador' },
    { value: 'DESARROLLADOR', label: 'Desarrollador' },
    { value: 'TECNICO', label: 'Técnico' },
    { value: 'EMPLEADO', label: 'Empleado' }
  ];

  constructor(
    private authService: AuthService,
    private promotorasService: PromotorasService,
    private alertaService: AlertaService,
    private router: Router,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeRegistrarUsuarios()) {
      this.router.navigate(['/usuarios']);
      return;
    }

    this.cargarPromotoras();

    const state = history.state;
    if (state && state.usuarioParaEditar) {
      const u = state.usuarioParaEditar;
      this.modoEdicion = true;
      this.usuarioId = u.id;
      this.username = u.username || '';
      this.nombre = u.nombre || '';
      this.correo = u.correo || '';
      this.telefono = u.telefono || '';
      this.rol = u.rol || '';
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

  registrarUsuario(): void {
    if (!this.username.trim() || !this.nombre.trim() || !this.rol) {
      this.alertaService.advertencia("Por favor complete todos los campos obligatorios.", "Campos Requeridos");
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
      rol: this.rol,
      telefono: this.telefono.trim(),
      correo: this.correo.trim(),
      activo: this.activo,
      idPromotora: this.rol === 'CLIENTE' ? this.idPromotora : null
    };

    if (this.modoEdicion && this.usuarioId) {
      this.authService.actualizarUsuarioPorAdmin(this.usuarioId, dto).subscribe({
        next: (res) => {
          this.cargando = false;
          this.cdr.detectChanges();
          
          if (res.succes) {
            this.alertaService.exito("Usuario actualizado con éxito.", "Usuario Modificado");
            this.router.navigate(['/usuarios']);
          } else {
            this.alertaService.error(res.mensaje || "Error al actualizar el usuario.", "Fallo de Guardado");
          }
        },
        error: (err) => {
          this.cargando = false;
          this.alertaService.error("Error al actualizar: " + (err.error?.mensaje || err.error || err.message), "Error");
          this.cdr.detectChanges();
        }
      });
    } else {
      this.authService.registrarUsuarioPorAdmin(dto).subscribe({
        next: (res) => {
          this.cargando = false;
          this.cdr.detectChanges();
          
          if (res.succes) {
            this.alertaService.exito("Usuario creado con éxito.", "Registro Completado");
            this.limpiarFormulario();
            this.router.navigate(['/usuarios']);
          } else {
            this.alertaService.error(res.mensaje || "Error al crear el usuario.", "Fallo de Registro");
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

  limpiarFormulario(): void {
    this.username = '';
    this.password = '';
    this.nombre = '';
    this.rol = '';
    this.telefono = '';
    this.correo = '';
    this.idPromotora = null;
    this.modoEdicion = false;
    this.usuarioId = null;
    this.cdr.detectChanges();
  }

  cancelar(): void {
    this.router.navigate(['/usuarios']);
  }
}
