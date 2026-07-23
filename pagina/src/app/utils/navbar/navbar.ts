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

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf, MatSelectModule, MatOption, MatOptgroup, NgForOf, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit, OnDestroy {
  promocionSeleccionada: number | null = null;
  paginaActual: string | null = "";
  principal: boolean = false;
  sidebarColapsado = false;

  promocionesAgrupadas: PromocionesRespuesta[] = [];
  
  // User Profile details
  nombreUsuario = 'Leonardo';
  rolUsuario = 'Administrador Odecor';
  iniciales = 'LN';
  mostrarMenuUsuario = false;

  // Dynamic ticket count
  cantidadIncidencias = 0;

  // Subscriptions to clean up
  private promoSub?: Subscription;
  private pageSub?: Subscription;
  private sidebarSub?: Subscription;

  constructor(
    private estadoGlobalService: EstadoGlobalService,
    private promocionesService: PromocionesService,
    private incidenciasService: IncidenciasService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    // 1. Escuchar eventos de ruteo para la miga de pan
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.actualizarMigaDePan();
    });
    this.actualizarMigaDePan();

    // 2. Cargar perfil del usuario logueado
    const user = this.authService.getCurrentUser();
    if (user) {
      this.nombreUsuario = user.nombre || user.username || 'Leonardo';
      this.rolUsuario = user.rol === 'ADMIN' ? 'Administrador Odecor' : 'Técnico Odecor';
      
      const words = this.nombreUsuario.split(' ');
      if (words.length > 1) {
        this.iniciales = (words[0][0] + words[1][0]).toUpperCase();
      } else {
        this.iniciales = this.nombreUsuario.substring(0, 2).toUpperCase();
      }
    }

    // 3. Obtener las promociones agrupadas por promotora del backend
    this.promocionesService.obtenerTodas().subscribe({
      next: (data) => {
        this.promocionesAgrupadas = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar promociones en navbar:", err);
      }
    });

    // 4. Suscribirse a los cambios de estado global
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
}
