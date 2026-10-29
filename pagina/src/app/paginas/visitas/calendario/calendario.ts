import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VisitasService } from '../../../servicios/visitas-service';
import { EstadoGlobalService } from '../../../servicios/global-service';
import { PromocionesService } from '../../../servicios/promociones-service';
import { VisitasRespuesta } from '../../../modelos/visitas.model';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  visits: VisitasRespuesta[];
}

@Component({
  selector: 'app-visitas-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss'
})
export class VisitasCalendarioComponent implements OnInit, OnDestroy {
  visitas: VisitasRespuesta[] = [];
  cargando = false;
  mapaColoresPromociones = new Map<string, string>();

  // Filtro de Promociones con autocompletado
  promocionSeleccionadaFiltro = '';
  busquedaPromocion = '';
  mostrarDropdownPromocion = false;
  promocionesExistentes: string[] = [];
  promocionesFiltradas: string[] = [];

  // Fecha actual en el calendario
  anioActual!: number;
  mesActual!: number; // 0-11
  
  meses = [
    { value: 0, label: 'Enero' },
    { value: 1, label: 'Febrero' },
    { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Mayo' },
    { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' },
    { value: 10, label: 'Noviembre' },
    { value: 11, label: 'Diciembre' }
  ];
  
  anios: number[] = [];
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  diasCalendario: CalendarDay[] = [];

  constructor(
    private visitasService: VisitasService,
    private promocionesService: PromocionesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    const hoy = new Date();
    this.anioActual = hoy.getFullYear();
    this.mesActual = hoy.getMonth();
    
    // Rellenar años (desde hace 2 años hasta 5 años en el futuro)
    const anioBase = hoy.getFullYear();
    for (let i = anioBase - 2; i <= anioBase + 5; i++) {
      this.anios.push(i);
    }
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {}

  cargarDatos(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    
    this.promocionesService.obtenerTodas().subscribe({
      next: (promos) => {
        this.mapaColoresPromociones.clear();
        const setPromos = new Set<string>();
        (promos || []).forEach(group => {
          if (group.promocion) {
            group.promocion.forEach(p => {
              if (p.nombre) {
                const name = p.nombre.toUpperCase().trim();
                setPromos.add(name);
                if (p.color) {
                  this.mapaColoresPromociones.set(name, p.color);
                }
              }
            });
          }
        });
        this.promocionesExistentes = Array.from(setPromos).sort();
        this.promocionesFiltradas = [...this.promocionesExistentes];
        
        this.cargarVisitas();
      },
      error: (err) => {
        console.error("Error al cargar promociones:", err);
        this.cargarVisitas();
      }
    });
  }

  cargarVisitas(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    this.visitasService.obtenerTodas().subscribe({
      next: (res) => {
        this.visitas = res || [];
        this.cargando = false;
        this.generarCalendario(this.anioActual, this.mesActual);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar visitas en calendario:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  obtenerColorVisita(v: VisitasRespuesta): string {
    if (v.promocion) {
      const color = this.mapaColoresPromociones.get(v.promocion.toUpperCase().trim());
      if (color) return color;
    }
    return '#a27b5c'; // color predeterminado
  }

  generarCalendario(anio: number, mes: number): void {
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const hoy = new Date();
    
    // Obtener día de la semana del primer día del mes (0=domingo, 1=lunes...)
    // Lo desplazamos para que el lunes sea 0, domingo sea 6
    let diaSemana = primerDia.getDay();
    let shift = diaSemana === 0 ? 6 : diaSemana - 1;
    
    const totalDias = ultimoDia.getDate();
    const diasArray: CalendarDay[] = [];
    
    // Rellenar días del mes anterior
    const ultimoDiaMesAnterior = new Date(anio, mes, 0).getDate();
    for (let i = shift - 1; i >= 0; i--) {
      const d = new Date(anio, mes - 1, ultimoDiaMesAnterior - i);
      diasArray.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: this.esMismoDia(d, hoy),
        visits: this.obtenerVisitasPorFecha(d)
      });
    }
    
    // Rellenar días del mes actual
    for (let i = 1; i <= totalDias; i++) {
      const d = new Date(anio, mes, i);
      diasArray.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: this.esMismoDia(d, hoy),
        visits: this.obtenerVisitasPorFecha(d)
      });
    }
    
    // Rellenar días del mes siguiente hasta completar las celdas necesarias
    // Usamos 42 celdas para que quepa todo el mes con sus márgenes
    const celdasRestantes = 42 - diasArray.length;
    for (let i = 1; i <= celdasRestantes; i++) {
      const d = new Date(anio, mes + 1, i);
      diasArray.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: this.esMismoDia(d, hoy),
        visits: this.obtenerVisitasPorFecha(d)
      });
    }
    
    this.diasCalendario = diasArray;
  }

  obtenerVisitasPorFecha(date: Date): VisitasRespuesta[] {
    return this.visitas.filter(v => {
      if (!v.diaVisita) return false;

      // Filter by selected promotion
      if (this.promocionSeleccionadaFiltro) {
        const vPromo = v.promocion ? v.promocion.toUpperCase().trim() : '';
        const fPromo = this.promocionSeleccionadaFiltro.toUpperCase().trim();
        if (vPromo !== fPromo) return false;
      }

      const dVisita = new Date(v.diaVisita);
      return dVisita.getFullYear() === date.getFullYear() &&
             dVisita.getMonth() === date.getMonth() &&
             dVisita.getDate() === date.getDate();
    });
  }

  // Métodos del autocompletador de promociones
  filtrarPromociones(): void {
    const filter = this.busquedaPromocion.toUpperCase().trim();
    this.promocionesFiltradas = this.promocionesExistentes.filter(p => p.includes(filter));
    
    // Si se borra la búsqueda, limpiar filtro
    if (!this.busquedaPromocion.trim()) {
      this.promocionSeleccionadaFiltro = '';
      this.generarCalendario(this.anioActual, this.mesActual);
    }
  }

  abrirDropdownPromocion(): void {
    this.mostrarDropdownPromocion = true;
    this.filtrarPromociones();
  }

  cerrarDropdownPromocion(): void {
    setTimeout(() => {
      this.mostrarDropdownPromocion = false;
      this.cdr.detectChanges();
    }, 250);
  }

  seleccionarPromocion(promo: string): void {
    this.promocionSeleccionadaFiltro = promo;
    this.busquedaPromocion = promo;
    this.mostrarDropdownPromocion = false;
    this.generarCalendario(this.anioActual, this.mesActual);
    this.cdr.detectChanges();
  }

  limpiarFiltroPromocion(): void {
    this.promocionSeleccionadaFiltro = '';
    this.busquedaPromocion = '';
    this.generarCalendario(this.anioActual, this.mesActual);
    this.cdr.detectChanges();
  }

  esMismoDia(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  mesAnterior(): void {
    if (this.mesActual === 0) {
      this.mesActual = 11;
      this.anioActual--;
    } else {
      this.mesActual--;
    }
    this.generarCalendario(this.anioActual, this.mesActual);
  }

  mesSiguiente(): void {
    if (this.mesActual === 11) {
      this.mesActual = 0;
      this.anioActual++;
    } else {
      this.mesActual++;
    }
    this.generarCalendario(this.anioActual, this.mesActual);
  }

  onFechaSelectorChange(): void {
    // Forzar conversión a número
    this.mesActual = Number(this.mesActual);
    this.anioActual = Number(this.anioActual);
    this.generarCalendario(this.anioActual, this.mesActual);
  }

  irADia(dia: CalendarDay): void {
    // Formatear fecha como YYYY-MM-DD
    const y = dia.date.getFullYear();
    const m = String(dia.date.getMonth() + 1).padStart(2, '0');
    const d = String(dia.date.getDate()).padStart(2, '0');
    const fechaStr = `${y}-${m}-${d}`;
    this.router.navigate([`/visitas/dia/${fechaStr}`]);
  }

  obtenerVisitasUnicasPorPromocion(visitas: VisitasRespuesta[]): VisitasRespuesta[] {
    const yaVistas = new Set<string>();
    return (visitas || []).filter(v => {
      const promo = v.promocion ? v.promocion.toUpperCase().trim() : '';
      if (yaVistas.has(promo)) {
        return false;
      }
      yaVistas.add(promo);
      return true;
    });
  }
}
