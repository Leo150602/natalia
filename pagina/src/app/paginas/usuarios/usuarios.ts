import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginRespuesta } from '../../servicios/auth-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PermisosService } from '../../servicios/permisos.service';
import { TablaDatosComponent } from '../../utils/tabla-datos/tabla-datos';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, TablaDatosComponent, RouterLink],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  currentUser: LoginRespuesta | null = null;
  cargando = false;
  mostrarMenuFiltros = false;

  filtroUsername = '';
  filtroNombre = '';
  filtroRol = '';

  rolesDisponibles = [
    { value: 'ADMINISTRADOR', label: 'Administrador' },
    { value: 'DESARROLLADOR', label: 'Desarrollador' },
    { value: 'TECNICO', label: 'Técnico' },
    { value: 'EMPLEADO', label: 'Empleado' }
  ];

  config = {
    idCampo: 'username',
    idNombre: 'Usuario (Login)',
    mostrarId: true,
    columnas: [
      { campo: 'nombre', nombre: 'Nombre Completo' },
      { campo: 'correo', nombre: 'Correo Electrónico' },
      { campo: 'telefono', nombre: 'Teléfono / Número' },
      { campo: 'rolText', nombre: 'Rol' },
      { campo: 'activoText', nombre: 'Estado' }
    ]
  };

  constructor(
    private authService: AuthService,
    private alertaService: AlertaService,
    private router: Router,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeVerMenuAdministracion()) {
      this.router.navigate(['/']);
      return;
    }

    this.currentUser = this.authService.getCurrentUser();
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.authService.getUsuarios().subscribe({
      next: (res) => {
        this.cargando = false;
        this.usuarios = res.map(u => ({
          ...u,
          rolText: this.getRolLabel(u.rol || ''),
          activoText: u.activo !== false ? 'Activo' : 'Inactivo'
        }));
        this.aplicarFiltros();
      },
      error: (err) => {
        this.cargando = false;
        this.alertaService.error("Error al obtener la lista de usuarios: " + (err.error || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    this.usuariosFiltrados = this.usuarios.filter(u => {
      if (this.currentUser && u.id === this.currentUser.id) {
        return false;
      }

      const matchUser = !this.filtroUsername.trim() || (u.username && u.username.toLowerCase().includes(this.filtroUsername.toLowerCase()));
      const matchName = !this.filtroNombre.trim() || (u.nombre && u.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase()));
      const matchRol = !this.filtroRol || (u.rol === this.filtroRol || u.rolText.toLowerCase().includes(this.filtroRol.toLowerCase()));

      return matchUser && matchName && matchRol;
    });
    this.cdr.detectChanges();
  }

  toggleMenuFiltros(): void {
    this.mostrarMenuFiltros = !this.mostrarMenuFiltros;
    this.cdr.detectChanges();
  }

  limpiarFiltros(): void {
    this.filtroUsername = '';
    this.filtroNombre = '';
    this.filtroRol = '';
    this.aplicarFiltros();
  }

  getRolLabel(rolName: string): string {
    const found = this.rolesDisponibles.find(r => r.value === rolName || r.value.toUpperCase() === rolName.toUpperCase());
    return found ? found.label : (rolName || '(Sin Rol)');
  }

  irAlDetalle(row: any): void {
    this.router.navigate([`/usuarios/detalle/${row.id}`]);
  }

  editarUsuario(u: any): void {
    this.router.navigate([`/usuarios/detalle/${u.id}`]);
  }

  eliminarUsuario(u: any): void {
    if (!u || !u.id) return;

    this.alertaService.confirmar(
      "¿Eliminar Usuario?", 
      `¿Está seguro de que desea eliminar permanentemente al usuario "${u.username}"?`,
      "Sí, eliminar"
    ).then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.cdr.detectChanges();
        this.authService.eliminarUsuario(u.id).subscribe({
          next: () => {
            this.alertaService.exito("Usuario eliminado con éxito.");
            this.cargarUsuarios();
          },
          error: (err) => {
            this.cargando = false;
            this.cdr.detectChanges();
            this.alertaService.error("Error al eliminar usuario: " + (err.error || err.message));
          }
        });
      }
    });
  }
}
