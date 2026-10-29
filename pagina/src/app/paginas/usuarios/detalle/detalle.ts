import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../servicios/auth-service';
import { AlertaService } from '../../../servicios/alerta-service';
import { PermisosService } from '../../../servicios/permisos.service';

@Component({
  selector: 'app-detalle-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss'
})
export class DetalleUsuarioComponent implements OnInit {

  usuarioId!: number;
  cargando = false;
  puedeEditar = false;
  modoCrear = false;
  modoEdicion = false;
  verPassword = false;

  usuario: any = {
    username: '',
    password: '',
    nombre: '',
    telefono: '',
    correo: '',
    activo: true,
    idPromotora: null,
    rol: ''
  };

  rolesDisponibles = [
    { value: 'ADMINISTRADOR', label: 'Administrador' },
    { value: 'DESARROLLADOR', label: 'Desarrollador' },
    { value: 'TECNICO', label: 'Técnico' },
    { value: 'EMPLEADO', label: 'Empleado' },
    { value: 'CLIENTE', label: 'Cliente' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private alertaService: AlertaService,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeRegistrarUsuarios()) {
      this.router.navigate(['/usuarios']);
      return;
    }

    this.puedeEditar = this.permisosService.puedeInsertarEditar();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/usuarios']);
      return;
    }

    if (idParam === 'nuevo') {
      this.modoCrear = true;
      this.modoEdicion = true;
      this.usuario = {
        username: '',
        password: '',
        nombre: '',
        telefono: '',
        correo: '',
        activo: true,
        idPromotora: null,
        rol: ''
      };
    } else {
      this.usuarioId = Number(idParam);
      this.cargarDatosUsuario();
    }
  }

  cargarDatosUsuario(): void {
    this.cargando = true;
    this.authService.getUsuarios().subscribe({
      next: (res) => {
        const found = res.find(u => u.id === this.usuarioId);
        if (found) {
          this.usuario = {
            username: found.username || '',
            password: '',
            nombre: found.nombre || '',
            telefono: found.telefono || '',
            correo: found.correo || '',
            activo: found.activo !== false,
            idPromotora: null,
            rol: found.rol || ''
          };
        } else {
          this.alertaService.error("No se pudo encontrar el usuario especificado.");
          this.router.navigate(['/usuarios']);
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar usuario:", err);
        this.cargando = false;
        this.alertaService.error("No se pudo cargar la información del usuario.");
        this.router.navigate(['/usuarios']);
      }
    });
  }

  // --- Operaciones CRUD ---

  actualizar(): void {
    if (!this.usuario.nombre.trim() || !this.usuario.rol) {
      this.alertaService.advertencia("Por favor complete todos los campos obligatorios (Nombre, Rol).");
      return;
    }

    if (this.modoCrear) {
      if (!this.usuario.username.trim()) {
        this.alertaService.advertencia("El nombre de usuario es obligatorio.");
        return;
      }
      if (!this.usuario.password.trim() || this.usuario.password.length < 4) {
        this.alertaService.advertencia("La contraseña es requerida para un nuevo registro y debe tener al menos 4 caracteres.");
        return;
      }
    }

    this.procederAGuardar();
  }

  procederAGuardar(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    const dto = {
      username: this.usuario.username.trim(),
      password: this.usuario.password,
      nombre: this.usuario.nombre.trim(),
      rol: this.usuario.rol,
      telefono: this.usuario.telefono.trim(),
      correo: this.usuario.correo.trim(),
      activo: this.usuario.activo,
      idPromotora: null
    };

    const operacion = this.modoCrear
      ? this.authService.registrarUsuarioPorAdmin(dto)
      : this.authService.actualizarUsuarioPorAdmin(this.usuarioId, dto);

    operacion.subscribe({
      next: (res) => {
        this.cargando = false;
        this.cdr.detectChanges();
        if (res.succes) {
          this.alertaService.exito(this.modoCrear ? "Usuario creado con éxito." : "Usuario actualizado con éxito.");
          this.router.navigate(['/usuarios']);
        } else {
          this.alertaService.error(res.mensaje || "Error al guardar el usuario.");
        }
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.alertaService.error("Error al guardar usuario: " + (err.error?.mensaje || err.error || err.message));
      }
    });
  }

  eliminar(): void {
    this.alertaService.confirmar(
      "¿Eliminar Usuario?", 
      `¿Está seguro de que desea eliminar permanentemente al usuario "${this.usuario.username}"?`,
      "Sí, eliminar"
    ).then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.authService.eliminarUsuario(this.usuarioId).subscribe({
          next: () => {
            this.cargando = false;
            this.alertaService.exito("Usuario eliminado con éxito.");
            this.router.navigate(['/usuarios']);
          },
          error: (err) => {
            this.cargando = false;
            this.cdr.detectChanges();
            this.alertaService.error("Error al eliminar usuario: " + (err.error?.mensaje || err.error || err.message));
          }
        });
      }
    });
  }

  activarModoEdicion(): void {
    this.modoEdicion = true;
    this.puedeEditar = true;
    this.cdr.detectChanges();
  }

  toggleActivo(): void {
    const nuevoEstado = !this.usuario.activo;
    const msg = nuevoEstado ? "¿Activar usuario?" : "¿Desactivar usuario?";
    const confirmMsg = nuevoEstado ? "El usuario tendrá acceso al sistema." : "El usuario ya no podrá iniciar sesión.";
    
    this.alertaService.confirmar(msg, confirmMsg).then(confirmado => {
      if (confirmado) {
        this.usuario.activo = nuevoEstado;
        this.procederAGuardarSilencioso();
      }
    });
  }

  procederAGuardarSilencioso(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    const dto = {
      username: this.usuario.username.trim(),
      password: this.usuario.password,
      nombre: this.usuario.nombre.trim(),
      rol: this.usuario.rol,
      telefono: this.usuario.telefono.trim(),
      correo: this.usuario.correo.trim(),
      activo: this.usuario.activo,
      idPromotora: null
    };
    this.authService.actualizarUsuarioPorAdmin(this.usuarioId, dto).subscribe({
      next: (res) => {
        this.cargando = false;
        this.cdr.detectChanges();
        if (res.succes) {
          this.alertaService.exito(this.usuario.activo ? "Usuario activado con éxito." : "Usuario desactivado con éxito.");
        } else {
          this.alertaService.error(res.mensaje || "Error al actualizar estado.");
          this.usuario.activo = !this.usuario.activo;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.cargando = false;
        this.usuario.activo = !this.usuario.activo;
        this.cdr.detectChanges();
        this.alertaService.error("Error al guardar: " + (err.error?.mensaje || err.error || err.message));
      }
    });
  }

  cancelar(): void {
    if (this.modoEdicion && !this.modoCrear) {
      this.modoEdicion = false;
      this.puedeEditar = false;
      this.cargarDatosUsuario();
    } else {
      this.router.navigate(['/usuarios']);
    }
  }
}
