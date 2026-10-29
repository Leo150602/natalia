import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PromocionesService } from '../../servicios/promociones-service';
import { EstadoGlobalService } from '../../servicios/global-service';
import { AlertaService } from '../../servicios/alerta-service';
import * as L from 'leaflet';

interface FlatPromocion {
  idPromocion: number;
  nombre: string;
  direccion: string;
  coordenadas: string;
  promotora: string;
  color?: string | null;
}

@Component({
  selector: 'app-mapa-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mapa-clientes.html',
  styleUrl: './mapa-clientes.scss'
})
export class MapaClientesComponent implements OnInit, AfterViewInit, OnDestroy {
  promociones: FlatPromocion[] = [];
  promocionesFiltradas: FlatPromocion[] = [];
  promotoras: string[] = [];
  cargando = false;

  // Filtros
  selectedPromotora = '';
  searchPromocion = '';
  searchDireccion = '';
  mostrarMenuFiltros = false;

  // Referencias de Leaflet
  private map!: L.Map;
  private markersGroup!: L.FeatureGroup;

  constructor(
    private promocionesService: PromocionesService,
    private estadoGlobal: EstadoGlobalService,
    private alerta: AlertaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPromociones();
  }

  ngAfterViewInit(): void {
    this.inicializarMapa();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  cargarPromociones(): void {
    this.cargando = true;
    this.promocionesService.obtenerTodas().subscribe({
      next: (res) => {
        const flatList: FlatPromocion[] = [];
        const promotorasSet = new Set<string>();

        res.forEach(item => {
          const promoName = item.promotora || 'Sin Promotora';
          if (item.promotora) {
            promotorasSet.add(item.promotora.trim());
          }
          if (item.promocion) {
            item.promocion.forEach(p => {
              flatList.push({
                idPromocion: p.idPromocion,
                nombre: p.nombre,
                direccion: p.direccion || '',
                coordenadas: p.coordenadas || '',
                promotora: promoName,
                color: p.color
              });
            });
          }
        });

        this.promociones = flatList;
        this.promotoras = Array.from(promotorasSet).sort();
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.alerta.error("Error al cargar promociones: " + (err.error || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  inicializarMapa(): void {
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
    this.map = L.map('mapa-clientes-leaflet', {
      zoomControl: true
    }).setView([41.3851, 2.1734], 13);

    // Cargar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.markersGroup = L.featureGroup().addTo(this.map);

    // Escuchar el evento de apertura de popups para enlazar los botones Angular de forma segura
    this.map.on('popupopen', (e: L.PopupEvent) => {
      const container = e.popup.getElement();
      if (container) {
        const btn = container.querySelector('.btn-seleccionar-promo');
        if (btn) {
          btn.addEventListener('click', (ev: Event) => {
            ev.preventDefault();
            const promoId = Number((ev.target as HTMLElement).getAttribute('data-promo-id'));
            this.seleccionarPromocion(promoId);
          });
        }
      }
    });

    // Forzar renderizado
    setTimeout(() => {
      this.map.invalidateSize();
      this.dibujarMarcadores();
    }, 350);
  }

  aplicarFiltros(): void {
    this.promocionesFiltradas = this.promociones.filter(p => {
      const matchPromotora = !this.selectedPromotora || p.promotora.toLowerCase() === this.selectedPromotora.toLowerCase();
      const matchNombre = !this.searchPromocion.trim() || p.nombre.toLowerCase().includes(this.searchPromocion.toLowerCase().trim());
      const matchDireccion = !this.searchDireccion.trim() || p.direccion.toLowerCase().includes(this.searchDireccion.toLowerCase().trim());
      return matchPromotora && matchNombre && matchDireccion;
    });

    this.dibujarMarcadores();
  }

  limpiarFiltros(): void {
    this.selectedPromotora = '';
    this.searchPromocion = '';
    this.searchDireccion = '';
    this.aplicarFiltros();
  }

  toggleMenuFiltros(): void {
    this.mostrarMenuFiltros = !this.mostrarMenuFiltros;
  }

  dibujarMarcadores(): void {
    if (!this.map || !this.markersGroup) return;

    this.markersGroup.clearLayers();
    let bounds = L.latLngBounds([]);

    this.promocionesFiltradas.forEach(p => {
      if (!p.coordenadas) return;

      const parts = p.coordenadas.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());

        if (!isNaN(lat) && !isNaN(lng)) {
          const latlng = L.latLng(lat, lng);
          bounds.extend(latlng);

          const markerColor = p.color || '#a27b5c';
          const pinSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${markerColor}"/>
            </svg>
          `;
          
          const customIcon = L.divIcon({
            html: pinSvg,
            className: 'custom-pin-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });

          const marker = L.marker(latlng, { icon: customIcon });
          
          const popupContent = `
            <div style="font-family: 'Outfit', sans-serif; padding: 6px; min-width: 200px;">
              <h6 style="margin: 0 0 4px; font-weight: bold; color: #1e293b; font-size: 0.95rem;">${p.nombre}</h6>
              <div style="font-size: 0.8rem; color: #475569; margin-bottom: 8px;">
                <p style="margin: 0 0 2px;"><strong>Promotora:</strong> ${p.promotora}</p>
                <p style="margin: 0 0 4px;"><strong>Dirección:</strong> ${p.direccion || 'Sin dirección registrada'}</p>
              </div>
              <button class="btn btn-primary btn-sm btn-seleccionar-promo w-100" 
                      data-promo-id="${p.idPromocion}" 
                      style="font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                🏢 Seleccionar Promoción
              </button>
            </div>
          `;

          marker.bindPopup(popupContent);
          this.markersGroup.addLayer(marker);
        }
      }
    });

    // Ajustar vista del mapa para encuadrar los marcadores filtrados si hay alguno
    if (this.promocionesFiltradas.some(p => p.coordenadas)) {
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      // Si no hay marcadores tras filtrar, restablecer a Barcelona
      this.map.setView([41.3851, 2.1734], 13);
    }
  }

  seleccionarPromocion(id: number): void {
    const promo = this.promociones.find(p => p.idPromocion === id);
    if (!promo) return;

    this.estadoGlobal.setPromocion(id);
    this.alerta.exito(`Se ha seleccionado la promoción "${promo.nombre}".`);
    this.router.navigate(['/incidencias']);
  }
}
