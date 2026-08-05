import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
import { EstadoGlobalService } from '../../servicios/global-service';
import { PromocionesService } from '../../servicios/promociones-service';
import { IncidenciasService } from '../../servicios/incidencias-service';
import { PromocionesRespuesta } from '../../modelos/promociones.model';
import { NgIf, NgForOf } from "@angular/common"; 
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { MatOptgroup } from '@angular/material/core';
import { AuthService } from '../../servicios/auth-service';
import { PermisosService } from '../../servicios/permisos.service';
import { AlertaService } from '../../servicios/alerta-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf, MatSelectModule, MatOption, MatOptgroup, NgForOf, RouterLink, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit, OnDestroy {
  promocionSeleccionada: number | null = null;
  paginaActual: string | null = "";
  principal: boolean = false;
  sidebarColapsado = false;

  promocionesAgrupadas: PromocionesRespuesta[] = [];
  
  nombreUsuario = 'Leonardo';
  rolUsuario = 'Administrador Odecor';
  iniciales = 'LN';
  mostrarMenuUsuario = false;

  cantidadIncidencias = 0;

  mostrarModalUsuario = false;
  modoEdicionUsuario = false;
  pestanaModalActual: 'datos' | 'seguridad' = 'datos';
  usernameUsuario = '';
  nombreUsuarioOriginal = '';
  correoUsuarioOriginal = '';
  telefonoUsuarioOriginal = '';
  nombreEditar = '';
  correoEditar = '';
  telefonoEditar = '';
  cargandoUsuario = false;

  contrasenaActual = '';
  nuevaContrasena = '';
  confirmarContrasena = '';
  cargandoPassword = false;
  verContrasenaActual = false;
  verNuevaContrasena = false;
  verConfirmarContrasena = false;

  private promoSub?: Subscription;
  private pageSub?: Subscription;
  private sidebarSub?: Subscription;
  private userSub?: Subscription;

  constructor(
    private estadoGlobalService: EstadoGlobalService,
    private promocionesService: PromocionesService,
    private incidenciasService: IncidenciasService,
    private authService: AuthService,
    public permisosService: PermisosService,
    private alertaService: AlertaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.actualizarMigaDePan();
    });
    this.actualizarMigaDePan();

    this.userSub = this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.nombreUsuario = user.nombre || user.username || 'Leonardo';
        this.rolUsuario = this.getRolLabel(user.rol || '');
        
        const words = this.nombreUsuario.split(' ');
        if (words.length > 1) {
          this.iniciales = (words[0][0] + words[1][0]).toUpperCase();
        } else {
          this.iniciales = this.nombreUsuario.substring(0, 2).toUpperCase();
        }
      } else {
        this.nombreUsuario = '';
        this.rolUsuario = '';
        this.iniciales = '';
      }
      this.cdr.detectChanges();
    });

    this.promocionesService.obtenerTodas().subscribe({
      next: (data) => {
        this.promocionesAgrupadas = this.permisosService.filtrarPromocionesAgrupadas(data);
        
        // Auto-seleccionar la primera promoción si el usuario es cliente y no hay ninguna seleccionada
        if (this.permisosService.esCliente() && this.promocionSeleccionada === null && this.promocionesAgrupadas.length > 0) {
          const firstGroup = this.promocionesAgrupadas[0];
          if (firstGroup.promocion && firstGroup.promocion.length > 0) {
            const firstPromoId = firstGroup.promocion[0].idPromocion;
            this.onPromocionChange(firstPromoId);
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar promociones en navbar:", err);
      }
    });

    this.promoSub = this.estadoGlobalService.promocion$.subscribe((promoId) => {
      this.promocionSeleccionada = promoId;
      if (promoId !== null) {
        this.cargarCantidadIncidencias(promoId);
      } else {
        this.cantidadIncidencias = 0;
      }
      this.cdr.detectChanges();
    });

    this.pageSub = this.estadoGlobalService.paginaActual$.subscribe((pagina) => {
      if (pagina.toLowerCase() === "home" || pagina.toLowerCase() === "inicio") {
        this.paginaActual = "Inicio";
        this.principal = true;
      } else {
        this.paginaActual = pagina;
        this.principal = false;
      }
      this.cdr.detectChanges();
    });

    this.sidebarSub = this.estadoGlobalService.sidebarColapsado$.subscribe((val) => {
      this.sidebarColapsado = val;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.promoSub) this.promoSub.unsubscribe();
    if (this.pageSub) this.pageSub.unsubscribe();
    if (this.sidebarSub) this.sidebarSub.unsubscribe();
    if (this.userSub) this.userSub.unsubscribe();
  }

  private cargarCantidadIncidencias(promoId: number): void {
    this.incidenciasService.obtenerCantidadPorPromocion(promoId).subscribe({
      next: (count) => {
        this.cantidadIncidencias = count;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al obtener cantidad en navbar:", err)
    });
  }

  private actualizarMigaDePan(): void {
    const urlPath = this.router.url.split('?')[0];
    const segments = urlPath.split('/').filter(s => s !== '');
    if (segments.length === 0) {
      this.estadoGlobalService.setPaginaActual('home');
    } else {
      let pageName = segments[0];
      pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
      this.estadoGlobalService.setPaginaActual(pageName);
    }
  }

  onPromocionChange(val: number): void {
    this.estadoGlobalService.setPromocion(val);
  }

  toggleSidebar(): void {
    this.estadoGlobalService.setSidebarColapsado(!this.sidebarColapsado);
  }

  toggleMenuUsuario(): void {
    this.mostrarMenuUsuario = !this.mostrarMenuUsuario;
  }

  abrirModalUsuario(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.cargandoUsuario = true;
      this.modoEdicionUsuario = false;
      this.pestanaModalActual = 'datos';
      this.usernameUsuario = user.username || '';
      this.nombreEditar = user.nombre || '';
      this.correoEditar = user.correo || '';
      this.telefonoEditar = user.telefono || '';
      
      this.contrasenaActual = '';
      this.nuevaContrasena = '';
      this.confirmarContrasena = '';

      this.mostrarModalUsuario = true;
      this.cdr.detectChanges();

      this.authService.obtenerUsuario(user.id).subscribe({
        next: (freshUser) => {
          this.cargandoUsuario = false;
          this.nombreEditar = freshUser.nombre || '';
          this.correoEditar = freshUser.correo || '';
          this.telefonoEditar = freshUser.telefono || '';
          
          this.nombreUsuarioOriginal = this.nombreEditar;
          this.correoUsuarioOriginal = this.correoEditar;
          this.telefonoUsuarioOriginal = this.telefonoEditar;

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cargandoUsuario = false;
          console.error("Error al obtener detalles de usuario:", err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  activarEdicionUsuario(): void {
    this.modoEdicionUsuario = true;
    this.nombreUsuarioOriginal = this.nombreEditar;
    this.correoUsuarioOriginal = this.correoEditar;
    this.telefonoUsuarioOriginal = this.telefonoEditar;
    this.cdr.detectChanges();
  }

  cancelarEdicionUsuario(): void {
    this.modoEdicionUsuario = false;
    this.nombreEditar = this.nombreUsuarioOriginal;
    this.correoEditar = this.correoUsuarioOriginal;
    this.telefonoEditar = this.telefonoUsuarioOriginal;
    this.cdr.detectChanges();
  }

  cerrarModalUsuario(): void {
    this.mostrarModalUsuario = false;
  }

  guardarDatosUsuario(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      if (!this.nombreEditar.trim()) {
        this.alertaService.advertencia("El nombre no puede estar vacío.");
        return;
      }
      this.cargandoUsuario = true;
      this.cdr.detectChanges();

      this.authService.actualizarUsuario(user.id, this.nombreEditar, this.correoEditar, this.telefonoEditar).subscribe({
        next: (updatedUser) => {
          this.cargandoUsuario = false;
          this.modoEdicionUsuario = false;
          this.alertaService.exito("Perfil actualizado con éxito.");
          
          this.nombreUsuario = updatedUser.nombre || updatedUser.username || 'Leonardo';
          const words = this.nombreUsuario.split(' ');
          if (words.length > 1) {
            this.iniciales = (words[0][0] + words[1][0]).toUpperCase();
          } else {
            this.iniciales = this.nombreUsuario.substring(0, 2).toUpperCase();
          }
          
          this.nombreUsuarioOriginal = this.nombreEditar;
          this.correoUsuarioOriginal = this.correoEditar;
          this.telefonoUsuarioOriginal = this.telefonoEditar;

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cargandoUsuario = false;
          this.alertaService.error("Error al actualizar perfil: " + (err.error || err.message));
          this.cdr.detectChanges();
        }
      });
    }
  }

  guardarNuevaPassword(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      if (!this.contrasenaActual || !this.nuevaContrasena || !this.confirmarContrasena) {
        this.alertaService.advertencia("Por favor complete todos los campos de contraseña.");
        return;
      }
      if (this.nuevaContrasena !== this.confirmarContrasena) {
        this.alertaService.advertencia("La nueva contraseña y la confirmación no coinciden.");
        return;
      }
      if (this.nuevaContrasena.length < 4) {
        this.alertaService.advertencia("La nueva contraseña debe tener al menos 4 caracteres.");
        return;
      }

      this.cargandoPassword = true;
      this.cdr.detectChanges();

      this.authService.cambiarPassword(user.id, this.contrasenaActual, this.nuevaContrasena).subscribe({
        next: (res) => {
          this.cargandoPassword = false;
          this.contrasenaActual = '';
          this.nuevaContrasena = '';
          this.confirmarContrasena = '';
          this.alertaService.exito("Contraseña actualizada con éxito.");
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cargandoPassword = false;
          this.alertaService.error("Error al cambiar contraseña: " + (err.error?.mensaje || err.error || err.message));
          this.cdr.detectChanges();
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    const profileBox = this.elementRef.nativeElement.querySelector('.navbar-profile-box');
    const dropdownMenu = this.elementRef.nativeElement.querySelector('.navbar-user-dropdown-menu');

    if (profileBox && profileBox.contains(targetElement)) {
      return;
    }

    if (dropdownMenu && dropdownMenu.contains(targetElement)) {
      return;
    }

    this.mostrarMenuUsuario = false;
  }

  getRolLabel(rol: string): string {
    if (!rol) return '(Sin Rol)';
    switch(rol.toUpperCase()) {
      case 'ADMINISTRADOR':
      case 'ADMIN':
        return 'Administrador';
      case 'DESARROLLADOR':
      case 'DEV':
        return 'Desarrollador';
      case 'CLIENTE':
        return 'Cliente';
      case 'TECNICO':
        return 'Técnico';
      case 'EMPLEADO':
        return 'Empleado';
      default:
        return rol;
    }
  }
}
