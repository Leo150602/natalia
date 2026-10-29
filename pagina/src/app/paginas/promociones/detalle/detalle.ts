import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PromocionesService } from '../../../servicios/promociones-service';
import { AlertaService } from '../../../servicios/alerta-service';
import { PermisosService } from '../../../servicios/permisos.service';
import { PromocionesDto } from '../../../modelos/promociones.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-detalle-promocion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss'
})
export class DetallePromocionComponent implements OnInit, AfterViewInit {

  idPromocion!: number;
  cargando = false;
  puedeEditar = false;
  modoCrear = false;
  modoEdicion = false;

  promocion: any = {
    promotora: '',
    promocion: '',
    direccion: '',
    coordenadas: ''
  };

  latitud = '';
  longitud = '';

  // Referencias de Leaflet
  private map!: L.Map;
  private marker: L.Marker | null = null;

  // Variables para autocompletar Promotora
  busquedaPromotora = '';
  mostrarDropdownPromotora = false;
  promotorasExistentes: string[] = [];
  promotorasFiltradas: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private promocionesService: PromocionesService,
    private alerta: AlertaService,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/promociones']);
      return;
    }

    this.puedeEditar = this.permisosService.puedeInsertarEditar();

    if (idParam === 'nuevo') {
      this.modoCrear = true;
      this.modoEdicion = true;
      this.promocion = {
        promotora: '',
        promocion: '',
        direccion: '',
        coordenadas: '',
        color: '#a27b5c'
      };
      this.latitud = '';
      this.longitud = '';
    } else {
      this.idPromocion = Number(idParam);
      this.cargarDatosPromocion();
    }

    this.cargarPromotorasExistentes();
  }

  cargarPromotorasExistentes(): void {
    this.promocionesService.obtenerTodas().subscribe({
      next: (res) => {
        const set = new Set<string>();
        res.forEach(group => {
          if (group.promotora) {
            set.add(group.promotora.toUpperCase().trim());
          }
        });
        this.promotorasExistentes = Array.from(set).sort();
        this.promotorasFiltradas = [...this.promotorasExistentes];
        
        if (this.promocion.promotora) {
          this.busquedaPromotora = this.promocion.promotora.toUpperCase();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar promotoras:", err)
    });
  }

  cargarDatosPromocion(): void {
    this.cargando = true;
    this.promocionesService.obtenerPorId(this.idPromocion).subscribe({
      next: (res) => {
        this.promocion = {
          promotora: res.promotora,
          promocion: res.promocion && res.promocion.length > 0 ? res.promocion[0].nombre : '',
          direccion: res.promocion && res.promocion.length > 0 ? (res.promocion[0].direccion || '') : '',
          coordenadas: res.promocion && res.promocion.length > 0 ? (res.promocion[0].coordenadas || '') : '',
          color: res.promocion && res.promocion.length > 0 ? (res.promocion[0].color || '#a27b5c') : '#a27b5c'
        };
        if (this.promocion.coordenadas) {
          const parts = this.promocion.coordenadas.split(',');
          if (parts.length === 2) {
            this.latitud = parts[0].trim();
            this.longitud = parts[1].trim();
          } else {
            this.latitud = '';
            this.longitud = '';
          }
        } else {
          this.latitud = '';
          this.longitud = '';
        }
        this.actualizarMapaDesdeInput();
        this.busquedaPromotora = res.promotora ? res.promotora.toUpperCase() : '';
        
        // Re-filtrar por si las promotoras existents ya cargaron
        if (this.promotorasExistentes.length > 0) {
          this.filtrarPromotoras();
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar promoción:", err);
        this.cargando = false;
        this.alerta.error("No se pudo cargar la información de la promoción.");
        this.router.navigate(['/promociones']);
      }
    });
  }

  // --- Métodos del Selector Autocompletable ---

  abrirDropdownPromotora(): void {
    if (!this.puedeEditar) return;
    this.mostrarDropdownPromotora = true;
    this.promotorasFiltradas = [...this.promotorasExistentes]; // Muestra todas al clickear
    this.cdr.detectChanges();
  }

  cerrarDropdownPromotora(): void {
    setTimeout(() => {
      this.mostrarDropdownPromotora = false;
      // Sincroniza el valor escrito (aunque sea nuevo) con el modelo
      this.promocion.promotora = this.busquedaPromotora.toUpperCase().trim();
      this.cdr.detectChanges();
    }, 150);
  }

  filtrarPromotoras(): void {
    const query = this.busquedaPromotora ? this.busquedaPromotora.toLowerCase() : '';
    const upperQuery = query.toUpperCase();

    // Si coincide con alguna opción actual o está recién clickeado, muestra todas
    if (this.promotorasExistentes.includes(upperQuery)) {
      this.promotorasFiltradas = [...this.promotorasExistentes];
    } else {
      this.promotorasFiltradas = this.promotorasExistentes.filter(p => p.toLowerCase().includes(query));
    }
  }

  seleccionarPromotora(p: string): void {
    this.promocion.promotora = p.toUpperCase().trim();
    this.busquedaPromotora = p.toUpperCase().trim();
    this.mostrarDropdownPromotora = false;
  }

  actualizar(): void {
    // Sincroniza el campo promotora
    this.promocion.promotora = this.busquedaPromotora.toUpperCase().trim();

    if (!this.promocion.promotora || !this.promocion.promocion) {
      this.alerta.advertencia("Por favor rellene todos los campos requeridos (Promotora y Promoción).");
      return;
    }

    if (this.latitud && this.longitud) {
      this.promocion.coordenadas = `${this.latitud.trim()}, ${this.longitud.trim()}`;
    } else {
      this.promocion.coordenadas = null;
    }

    this.cargando = true;
    const dto: PromocionesDto = {
      promotora: this.promocion.promotora,
      promocion: this.promocion.promocion.toUpperCase(),
      direccion: this.promocion.direccion || null,
      coordenadas: this.promocion.coordenadas || null,
      color: this.promocion.color || '#a27b5c'
    };

    const operacion = this.modoCrear
      ? this.promocionesService.insertar(dto)
      : this.promocionesService.actualizar(this.idPromocion, dto);

    operacion.subscribe({
      next: () => {
        this.cargando = false;
        this.alerta.exito(this.modoCrear ? "Promoción registrada con éxito." : "Promoción actualizada con éxito.");
        this.router.navigate(['/promociones']);
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.alerta.error("Error al guardar la promoción: " + (err.error || err.message));
      }
    });
  }

  eliminar(): void {
    this.alerta.confirmar(
      '¿Eliminar Promoción?',
      `¿Está seguro de que desea eliminar la promoción "${this.promocion.promocion}"?`
    ).then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.promocionesService.eliminar(this.idPromocion).subscribe({
          next: () => {
            this.cargando = false;
            this.alerta.exito("Promoción eliminada con éxito.");
            this.router.navigate(['/promociones']);
          },
          error: (err) => {
            this.cargando = false;
            this.cdr.detectChanges();
            this.alerta.error("Error al eliminar la promoción: " + (err.error || err.message));
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

  cancelar(): void {
    if (this.modoEdicion && !this.modoCrear) {
      this.modoEdicion = false;
      this.puedeEditar = false;
      this.cargarDatosPromocion();
    } else {
      this.router.navigate(['/promociones']);
    }
  }

  ngAfterViewInit(): void {
    // Configurar el marcador por defecto para evitar rotura de imágenes relativas de Leaflet
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = defaultIcon;

    // Inicializar mapa centrado en Barcelona por defecto
    this.map = L.map('mapa-seleccion-leaflet', {
      zoomControl: true
    }).setView([41.3851, 2.1734], 13);

    // Cargar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Si ya hay coordenadas, cargarlas
    if (this.promocion.coordenadas) {
      this.actualizarMapaDesdeInput();
    }

    // Escuchar clics en el mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.puedeEditar || !this.modoEdicion) return;
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      this.promocion.coordenadas = `${lat}, ${lng}`;
      this.latitud = lat;
      this.longitud = lng;

      if (this.marker) {
        this.marker.setLatLng(e.latlng);
        this.marker.setIcon(this.crearIconoMarcador());
      } else {
        this.marker = L.marker(e.latlng, { icon: this.crearIconoMarcador() }).addTo(this.map);
      }
      this.cdr.detectChanges();
    });

    // Forzar redibujado para evitar cortes de tiles
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }

  crearIconoMarcador(): L.DivIcon {
    const markerColor = this.promocion.color || '#a27b5c';
    const pinSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${markerColor}"/>
      </svg>
    `;
    return L.divIcon({
      html: pinSvg,
      className: 'custom-pin-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  actualizarMapaDesdeInput(): void {
    if (!this.map || !this.promocion.coordenadas) return;
    const parts = this.promocion.coordenadas.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        const latlng = L.latLng(lat, lng);
        this.map.setView(latlng, 15);
        if (this.marker) {
          this.marker.setLatLng(latlng);
          this.marker.setIcon(this.crearIconoMarcador());
        } else {
          this.marker = L.marker(latlng, { icon: this.crearIconoMarcador() }).addTo(this.map);
        }
        this.latitud = parts[0].trim();
        this.longitud = parts[1].trim();
      }
    }
  }

  actualizarMapaDesdeInputs(): void {
    this.promocion.coordenadas = `${this.latitud || ''}, ${this.longitud || ''}`;
    if (!this.latitud && !this.longitud) {
      if (this.marker && this.map) {
        this.map.removeLayer(this.marker);
        this.marker = null;
      }
    } else {
      this.actualizarMapaDesdeInput();
    }
  }
}
