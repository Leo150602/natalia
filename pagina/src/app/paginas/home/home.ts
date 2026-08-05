import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { IncidenciasService } from '../../servicios/incidencias-service';
import { PromocionesService } from '../../servicios/promociones-service';
import { PisosService } from '../../servicios/pisos-service';
import { VisitasService } from '../../servicios/visitas-service';
import { AuthService } from '../../servicios/auth-service';
import { EstadoGlobalService } from '../../servicios/global-service';
import { IncidenciasRespuesta } from '../../modelos/incidencias.model';
import { PromocionesRespuesta, PromocionItem } from '../../modelos/promociones.model';
import { PisosRespuesta } from '../../modelos/pisos.model';
import { VisitasRespuesta } from '../../modelos/visitas.model';
import { PermisosService } from '../../servicios/permisos.service';
import { SolicitudesService } from '../../servicios/solicitudes-service';

interface GraficoPunto {
  x: number;
  y: number;
  valor: number;
  etiqueta: string;
}

interface CategoriaResumen {
  numero: number;
  nombre: string;
  total: number;
  resueltas: number;
  abiertas: number;
  tasa: number;
  estadoSla: 'verde' | 'naranja' | 'rojo';
}

interface IncidenciaCritica {
  numeroIncidencia: string;
  piso: string;
  promocion: string;
  diasAbierta: number;
  categoria: string;
  descripcion: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  Math = Math;
  
  todasLasIncidencias: IncidenciasRespuesta[] = [];
  todasLasPisos: PisosRespuesta[] = [];
  promocionesAgrupadas: PromocionesRespuesta[] = [];
  
  // Lista para los dropdowns
  listaPromotoras: string[] = [];
  listaPromociones: PromocionItem[] = []; // Depende de la promotora seleccionada

  // Filtros activos
  promotoraSeleccionada = 'TODAS';
  promocionSeleccionada: number | 'TODAS' = 'TODAS';

  promocionId: number | null = null;
  private promoSub?: Subscription;

  // Variables para Técnico
  incidenciasTecnico: IncidenciasRespuesta[] = [];
  incidenciasTecnicoFiltradas: IncidenciasRespuesta[] = [];
  visitasTecnico: VisitasRespuesta[] = [];
  visitasTecnicoFiltradas: VisitasRespuesta[] = [];

  filtroIncidencias = {
    numero: '',
    piso: '',
    estado: ''
  };

  filtroVisitas = {
    numero: '',
    piso: '',
    estadoVisita: ''
  };

  // Control de Pestañas
  pestanaActiva = 'operacion';

  // Indicadores
  totalIncidencias = 0;
  totalAbiertas = 0;
  totalResueltas = 0;
  tasaResolucion = 0;
  totalPisos = 0;
  totalPromociones = 0;
  totalSolicitudesPendientes = 0;
  totalFueraDePlazo = 0;
  totalUltimaSemana = 0;
  todasLasSolicitudes: IncidenciasRespuesta[] = [];

  // Comparativa Mensual
  resueltasEsteMes = 0;
  resueltasMesAnterior = 0;
  comparativaMensualPorcentaje = 0;
  comparativaMensualDireccion: 'subio' | 'bajo' | 'igual' = 'igual';

  // Evolución del Volumen
  nuevasEsteMes = 0;
  nuevasMesAnterior = 0;
  evolucionPorcentaje = 0;
  evolucionDireccion: 'subio' | 'bajo' | 'igual' = 'igual';

  // Resumen Agrupado por Categorías (para la tabla visual de resumen)
  listaCategoriasResumen: CategoriaResumen[] = [];

  // Incidencias Críticas (para notificaciones de SLA excedido)
  listaIncidenciasCriticas: IncidenciaCritica[] = [];
  listaUltimasIncidencias: any[] = [];

  // Datos para Gráfico Comparativa Mensual (Barras - Totales vs Resueltos)
  svgBarraMesAnteriorTotalHeight = 0;
  svgBarraMesAnteriorResueltasHeight = 0;
  svgBarraEsteMesTotalHeight = 0;
  svgBarraEsteMesResueltasHeight = 0;

  // Datos para Gráfico de Evolución (Dos líneas: Totales vs Resueltos)
  svgEvolucionLineNuevas = '';
  svgEvolucionAreaNuevas = '';
  svgEvolucionLineResueltas = '';
  svgEvolucionAreaResueltas = '';
  svgEvolucionPuntosNuevas: GraficoPunto[] = [];
  svgEvolucionPuntosResueltas: GraficoPunto[] = [];
  svgEvolucionMax = 10;

  // Semáforo
  semaforoColor: 'verde' | 'naranja' | 'rojo' = 'verde';
  semaforoTexto = '';
  semaforoExplicacion = '';

  cargando = false;

  constructor(
    private incidenciasService: IncidenciasService,
    private promocionesService: PromocionesService,
    private pisosService: PisosService,
    private visitasService: VisitasService,
    private authService: AuthService,
    private estadoGlobalService: EstadoGlobalService,
    public permisosService: PermisosService,
    private solicitudesService: SolicitudesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.promoSub = this.estadoGlobalService.promocion$.subscribe((id) => {
      this.promocionId = id;
      this.cargarDatos();
    });
  }

  ngOnDestroy(): void {
    if (this.promoSub) {
      this.promoSub.unsubscribe();
    }
  }

  formatearFecha(fechaStr: any): string {
    if (!fechaStr) return '';
    const date = new Date(fechaStr);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${mes}-${dia}`;
  }

  cargarDatos(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    if (this.permisosService.esTecnico()) {
      if (this.promocionId === null) {
        this.incidenciasTecnico = [];
        this.incidenciasTecnicoFiltradas = [];
        this.visitasTecnico = [];
        this.visitasTecnicoFiltradas = [];
        this.cargando = false;
        this.cdr.detectChanges();
        return;
      }

      forkJoin({
        incidencias: this.incidenciasService.obtenerPorPromocion(this.promocionId, true),
        visitas: this.visitasService.obtenerPorPromocion(this.promocionId)
      }).subscribe({
        next: (res) => {
          const user = this.authService.getCurrentUser();
          const nombreTecnico = user?.nombre || user?.username || '';

          // Incidencias no terminadas (incluyendo solicitadas y rechazadas)
          this.incidenciasTecnico = res.incidencias.filter(inc => inc.estado !== 'Terminado');

          // Visitas en las que el técnico es partícipe
          this.visitasTecnico = res.visitas.filter(v => 
            v.tecnicoNombre && nombreTecnico && 
            v.tecnicoNombre.toLowerCase().trim() === nombreTecnico.toLowerCase().trim()
          );

          this.aplicarFiltrosTecnico();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error al cargar datos del dashboard técnico:", err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      forkJoin({
        promociones: this.promocionesService.obtenerTodas(),
        pisos: this.pisosService.obtenerTodos(),
        incidencias: this.incidenciasService.obtenerTodas(),
        solicitudes: this.solicitudesService.obtenerSolicitudes()
      }).subscribe({
        next: (res) => {
          // 1. Promociones
          this.promocionesAgrupadas = this.permisosService.filtrarPromocionesAgrupadas(res.promociones);
          this.listaPromotoras = this.promocionesAgrupadas.map(g => g.promotora);
          this.actualizarListaPromociones();

          // 2. Pisos y solicitudes
          if (this.permisosService.esCliente()) {
            const user = this.authService.getCurrentUser();
            const nombrePromotora = user?.nombrePromotora;
            if (nombrePromotora) {
              this.todasLasPisos = res.pisos.filter(p => p.promotora && p.promotora.toLowerCase().trim() === nombrePromotora.toLowerCase().trim());
              this.todasLasIncidencias = res.incidencias.filter(inc => inc.pisos?.promotora && inc.pisos.promotora.toLowerCase().trim() === nombrePromotora.toLowerCase().trim());
              this.todasLasSolicitudes = res.solicitudes.filter(inc => inc.pisos?.promotora && inc.pisos.promotora.toLowerCase().trim() === nombrePromotora.toLowerCase().trim());
            } else {
              this.todasLasPisos = [];
              this.todasLasIncidencias = [];
              this.todasLasSolicitudes = [];
            }
          } else {
            this.todasLasPisos = res.pisos;
            this.todasLasIncidencias = res.incidencias;
            this.todasLasSolicitudes = res.solicitudes;
          }

          this.calcularMetricas();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error al cargar datos del dashboard:", err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  actualizarListaPromociones(): void {
    if (this.promotoraSeleccionada === 'TODAS') {
      const todas: PromocionItem[] = [];
      this.promocionesAgrupadas.forEach(g => {
        todas.push(...g.promocion);
      });
      this.listaPromociones = todas;
    } else {
      const grupo = this.promocionesAgrupadas.find(g => g.promotora === this.promotoraSeleccionada);
      this.listaPromociones = grupo ? grupo.promocion : [];
    }
    this.promocionSeleccionada = 'TODAS';
    this.calcularMetricas();
  }

  onPromotoraChange(): void {
    this.actualizarListaPromociones();
  }

  onPromocionChange(): void {
    this.calcularMetricas();
  }

  cambiarPestana(pestana: string): void {
    this.pestanaActiva = pestana;
    this.cdr.detectChanges();
  }

  calcularMetricas(): void {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    const primerDiaMesActual = new Date(anioActual, mesActual, 1);
    const ultimoDiaMesAnterior = new Date(primerDiaMesActual.getTime() - 1);
    const mesAnterior = ultimoDiaMesAnterior.getMonth();
    const anioMesAnterior = ultimoDiaMesAnterior.getFullYear();

    const promoFiltroItem = this.promocionSeleccionada === 'TODAS' ? null : 
      this.listaPromociones.find(p => String(p.idPromocion) === String(this.promocionSeleccionada));

    // 1. Filtrar pisos
    const pisosFiltrados = this.todasLasPisos.filter(p => {
      const matchPromotora = this.promotoraSeleccionada === 'TODAS' || p.promotora === this.promotoraSeleccionada;
      const matchPromocion = this.promocionSeleccionada === 'TODAS' || p.promocion === promoFiltroItem?.nombre;
      return matchPromotora && matchPromocion;
    });
    this.totalPisos = pisosFiltrados.length;

    // Cantidad de promociones
    if (this.promotoraSeleccionada === 'TODAS') {
      this.totalPromociones = this.listaPromociones.length;
    } else {
      if (this.promocionSeleccionada === 'TODAS') {
        const grupo = this.promocionesAgrupadas.find(g => g.promotora === this.promotoraSeleccionada);
        this.totalPromociones = grupo ? grupo.promocion.length : 0;
      } else {
        this.totalPromociones = 1;
      }
    }

    // Calcular solicitudes pendientes
    const solicitudesFiltradas = this.todasLasSolicitudes.filter(sol => {
      const matchPromotora = this.promotoraSeleccionada === 'TODAS' || 
                            (sol.pisos?.promotora === this.promotoraSeleccionada);
      const matchPromocion = this.promocionSeleccionada === 'TODAS' || 
                            (sol.pisos?.promocion === promoFiltroItem?.nombre);
      return matchPromotora && matchPromocion;
    });
    this.totalSolicitudesPendientes = solicitudesFiltradas.length;

    // 2. Filtrar incidencias
    const incidenciasFiltradas = this.todasLasIncidencias.filter(inc => {
      const matchPromotora = this.promotoraSeleccionada === 'TODAS' || 
                            (inc.pisos?.promotora === this.promotoraSeleccionada);
      const matchPromocion = this.promocionSeleccionada === 'TODAS' || 
                            (inc.pisos?.promocion === promoFiltroItem?.nombre);
      return matchPromotora && matchPromocion;
    });

    // 3. Resumen de Totales
    this.totalIncidencias = incidenciasFiltradas.length;
    this.totalResueltas = incidenciasFiltradas.filter(i => i.estado === 'Terminado').length;
    this.totalAbiertas = this.totalIncidencias - this.totalResueltas;
    this.tasaResolucion = this.totalIncidencias > 0 ? Math.round((this.totalResueltas / this.totalIncidencias) * 100) : 0;

    // 4. Comparativa Mensual (Resueltas este mes vs mes anterior)
    this.resueltasEsteMes = incidenciasFiltradas.filter(i => {
      if (i.estado !== 'Terminado') return false;
      const dateToUse = i.fechaActualizacion ? i.fechaActualizacion : i.fechaIncidencia;
      const f = new Date(dateToUse);
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    }).length;

    this.resueltasMesAnterior = incidenciasFiltradas.filter(i => {
      if (i.estado !== 'Terminado') return false;
      const dateToUse = i.fechaActualizacion ? i.fechaActualizacion : i.fechaIncidencia;
      const f = new Date(dateToUse);
      return f.getMonth() === mesAnterior && f.getFullYear() === anioMesAnterior;
    }).length;

    if (this.resueltasMesAnterior > 0) {
      this.comparativaMensualPorcentaje = Math.round(
        ((this.resueltasEsteMes - this.resueltasMesAnterior) / this.resueltasMesAnterior) * 100
      );
    } else {
      this.comparativaMensualPorcentaje = this.resueltasEsteMes > 0 ? 100 : 0;
    }

    if (this.resueltasEsteMes > this.resueltasMesAnterior) {
      this.comparativaMensualDireccion = 'subio';
    } else if (this.resueltasEsteMes < this.resueltasMesAnterior) {
      this.comparativaMensualDireccion = 'bajo';
    } else {
      this.comparativaMensualDireccion = 'igual';
    }

    // 5. Evolución del Volumen (Nuevas)
    this.nuevasEsteMes = incidenciasFiltradas.filter(i => {
      const f = new Date(i.fechaIncidencia);
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    }).length;

    this.nuevasMesAnterior = incidenciasFiltradas.filter(i => {
      const f = new Date(i.fechaIncidencia);
      return f.getMonth() === mesAnterior && f.getFullYear() === anioMesAnterior;
    }).length;

    if (this.nuevasMesAnterior > 0) {
      this.evolucionPorcentaje = Math.round(
        ((this.nuevasEsteMes - this.nuevasMesAnterior) / this.nuevasMesAnterior) * 100
      );
    } else {
      this.evolucionPorcentaje = this.nuevasEsteMes > 0 ? 100 : 0;
    }

    if (this.nuevasEsteMes > this.nuevasMesAnterior) {
      this.evolucionDireccion = 'subio';
    } else if (this.nuevasEsteMes < this.nuevasMesAnterior) {
      this.evolucionDireccion = 'bajo';
    } else {
      this.evolucionDireccion = 'igual';
    }

    // 6. SLA y Fuera de Plazo (> 7 días / 1 semana)
    const limiteSLA = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.totalFueraDePlazo = incidenciasFiltradas.filter(i => {
      if (i.estado === 'Terminado') return false;
      const f = new Date(i.fechaIncidencia);
      return f < limiteSLA;
    }).length;

    // Calcular incidencias creadas en la última semana
    this.totalUltimaSemana = incidenciasFiltradas.filter(i => {
      const f = new Date(i.fechaIncidencia);
      return f >= limiteSLA;
    }).length;

    const openRate = this.totalIncidencias > 0 ? (this.totalAbiertas / this.totalIncidencias) * 100 : 0;

    if (this.totalIncidencias === 0) {
      this.semaforoColor = 'verde';
      this.semaforoTexto = 'Sin incidencias';
      this.semaforoExplicacion = 'No hay incidencias registradas bajo los filtros seleccionados.';
    } else if (this.tasaResolucion < 25) {
      this.semaforoColor = 'rojo';
      this.semaforoTexto = 'Alerta Roja';
      this.semaforoExplicacion = 'Tasa de resolución crítica (por debajo del 25%). Requiere atención inmediata.';
    } else if (this.tasaResolucion > 75) {
      this.semaforoColor = 'verde';
      this.semaforoTexto = 'Alerta Verde';
      this.semaforoExplicacion = 'Tasa de resolución óptima (por encima del 75%). Ritmo de cierre bajo control.';
    } else {
      this.semaforoColor = 'naranja';
      this.semaforoTexto = 'Alerta Naranja';
      this.semaforoExplicacion = 'Tasa de resolución intermedia (entre 25% y 75%). Se recomienda hacer seguimiento.';
    }

    // 7. Agrupar por Categorías para la Tabla Resumen
    const grupos = new Map<string, IncidenciasRespuesta[]>();
    incidenciasFiltradas.forEach(i => {
      const catName = i.categoria || 'Sin Categoría';
      if (!grupos.has(catName)) {
        grupos.set(catName, []);
      }
      grupos.get(catName)!.push(i);
    });

    let index = 1;
    this.listaCategoriasResumen = [];
    grupos.forEach((list, key) => {
      const tot = list.length;
      const res = list.filter(i => i.estado === 'Terminado').length;
      const ab = tot - res;
      const rate = tot > 0 ? Math.round((res / tot) * 100) : 0;
      
      let estSla: 'verde' | 'naranja' | 'rojo' = 'verde';
      if (rate < 25) {
        estSla = 'rojo';
      } else if (rate > 75) {
        estSla = 'verde';
      } else {
        estSla = 'naranja';
      }

      this.listaCategoriasResumen.push({
        numero: index++,
        nombre: key,
        total: tot,
        resueltas: res,
        abiertas: ab,
        tasa: rate,
        estadoSla: estSla
      });
    });

    // 8. Incidencias Críticas
    this.listaIncidenciasCriticas = incidenciasFiltradas
      .filter(i => {
        if (i.estado === 'Terminado') return false;
        const f = new Date(i.fechaIncidencia);
        return f < limiteSLA;
      })
      .map(i => {
        const creado = new Date(i.fechaIncidencia);
        const diffTime = Math.abs(ahora.getTime() - creado.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          numeroIncidencia: i.numeroIncidencia,
          piso: i.pisos?.piso || 'Sin Piso',
          promocion: i.pisos?.promocion || 'Sin Promoción',
          diasAbierta: diffDays,
          categoria: i.categoria || 'General',
          descripcion: i.descripcion || 'Sin descripción'
        };
      })
      .sort((a, b) => b.diasAbierta - a.diasAbierta)
      .slice(0, 10);

    // 8.5 Últimas Incidencias por orden de fecha
    this.listaUltimasIncidencias = incidenciasFiltradas
      .map(i => {
        const f = new Date(i.fechaIncidencia);
        return {
          numeroIncidencia: i.numeroIncidencia,
          piso: i.pisos?.piso || 'Sin Piso',
          promocion: i.pisos?.promocion || 'Sin Promoción',
          promotora: i.pisos?.promotora || 'Sin Promotora',
          fecha: f,
          fechaFormateada: this.formatearFecha(i.fechaIncidencia),
          estado: i.estado || 'Pendiente',
          descripcion: i.descripcion || 'Sin descripción'
        };
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 5);

    // 9. Generación de Gráficos SVG
    this.generarGraficosSVG(incidenciasFiltradas, ahora);
  }

  generarGraficosSVG(incidencias: IncidenciasRespuesta[], ahora: Date): void {
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    const primerDiaMesActual = new Date(anioActual, mesActual, 1);
    const ultimoDiaMesAnterior = new Date(primerDiaMesActual.getTime() - 1);
    const mesAnterior = ultimoDiaMesAnterior.getMonth();
    const anioMesAnterior = ultimoDiaMesAnterior.getFullYear();

    // A. Gráfico de Barras: Comparativa Mensual (Total Creados vs Resueltos)
    // Mes anterior - Total
    const totalCreadasMesAnterior = incidencias.filter(i => {
      const f = new Date(i.fechaIncidencia);
      return f.getMonth() === mesAnterior && f.getFullYear() === anioMesAnterior;
    }).length;

    // Mes actual - Total
    const totalCreadasEsteMes = incidencias.filter(i => {
      const f = new Date(i.fechaIncidencia);
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    }).length;

    const maxMeses = Math.max(
      totalCreadasEsteMes, 
      this.resueltasEsteMes, 
      totalCreadasMesAnterior, 
      this.resueltasMesAnterior, 
      5
    );

    this.svgBarraMesAnteriorTotalHeight = Math.round((totalCreadasMesAnterior / maxMeses) * 120);
    this.svgBarraMesAnteriorResueltasHeight = Math.round((this.resueltasMesAnterior / maxMeses) * 120);
    this.svgBarraEsteMesTotalHeight = Math.round((totalCreadasEsteMes / maxMeses) * 120);
    this.svgBarraEsteMesResueltasHeight = Math.round((this.resueltasEsteMes / maxMeses) * 120);


    // B. Gráfico de Línea: Evolución (Nuevas vs Resueltas por semanas en los últimos 28 días)
    const countsNuevas = [0, 0, 0, 0];
    const countsResueltas = [0, 0, 0, 0];
    const labels = ['Semana -3', 'Semana -2', 'Semana -1', 'Semana Actual'];

    const unDia = 24 * 60 * 60 * 1000;
    const finSemanaActual = ahora.getTime();
    const finSemana1 = finSemanaActual - 7 * unDia;
    const finSemana2 = finSemanaActual - 14 * unDia;
    const finSemana3 = finSemanaActual - 21 * unDia;
    const finSemana4 = finSemanaActual - 28 * unDia;

    incidencias.forEach(i => {
      const fTime = new Date(i.fechaIncidencia).getTime();
      
      // Nuevas creadas
      if (fTime >= finSemana1 && fTime <= finSemanaActual) {
        countsNuevas[3]++;
      } else if (fTime >= finSemana2 && fTime < finSemana1) {
        countsNuevas[2]++;
      } else if (fTime >= finSemana3 && fTime < finSemana2) {
        countsNuevas[1]++;
      } else if (fTime >= finSemana4 && fTime < finSemana3) {
        countsNuevas[0]++;
      }

      // Resueltas (creadas en esa semana que están en estado Terminado)
      if (i.estado === 'Terminado') {
        if (fTime >= finSemana1 && fTime <= finSemanaActual) {
          countsResueltas[3]++;
        } else if (fTime >= finSemana2 && fTime < finSemana1) {
          countsResueltas[2]++;
        } else if (fTime >= finSemana3 && fTime < finSemana2) {
          countsResueltas[1]++;
        } else if (fTime >= finSemana4 && fTime < finSemana3) {
          countsResueltas[0]++;
        }
      }
    });

    const maxVal = Math.max(...countsNuevas, ...countsResueltas, 4);
    this.svgEvolucionMax = maxVal;

    const width = 300;
    const height = 160;
    const paddingX = 40;
    const paddingY = 25;

    const chartWidth = width - 2 * paddingX;
    const chartHeight = height - 2 * paddingY;

    // Calcular Puntos para Nuevas
    this.svgEvolucionPuntosNuevas = countsNuevas.map((c, idx) => {
      const x = paddingX + idx * (chartWidth / 3);
      const y = (height - paddingY) - (c / maxVal) * chartHeight;
      return {
        x: Math.round(x),
        y: Math.round(y),
        valor: c,
        etiqueta: labels[idx]
      };
    });

    // Calcular Puntos para Resueltas
    this.svgEvolucionPuntosResueltas = countsResueltas.map((c, idx) => {
      const x = paddingX + idx * (chartWidth / 3);
      const y = (height - paddingY) - (c / maxVal) * chartHeight;
      return {
        x: Math.round(x),
        y: Math.round(y),
        valor: c,
        etiqueta: labels[idx]
      };
    });

    // Generar Paths de Línea y Área para Nuevas
    if (this.svgEvolucionPuntosNuevas.length > 0) {
      const pts = this.svgEvolucionPuntosNuevas;
      let linePath = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        linePath += ` L ${pts[i].x} ${pts[i].y}`;
      }
      this.svgEvolucionLineNuevas = linePath;

      let areaPath = `M ${pts[0].x} ${height - paddingY}`;
      areaPath += ` L ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        areaPath += ` L ${pts[i].x} ${pts[i].y}`;
      }
      areaPath += ` L ${pts[pts.length - 1].x} ${height - paddingY} Z`;
      this.svgEvolucionAreaNuevas = areaPath;
    }

    // Generar Paths de Línea y Área para Resueltas
    if (this.svgEvolucionPuntosResueltas.length > 0) {
      const pts = this.svgEvolucionPuntosResueltas;
      let linePath = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        linePath += ` L ${pts[i].x} ${pts[i].y}`;
      }
      this.svgEvolucionLineResueltas = linePath;

      let areaPath = `M ${pts[0].x} ${height - paddingY}`;
      areaPath += ` L ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        areaPath += ` L ${pts[i].x} ${pts[i].y}`;
      }
      areaPath += ` L ${pts[pts.length - 1].x} ${height - paddingY} Z`;
      this.svgEvolucionAreaResueltas = areaPath;
    }
  }

  aplicarFiltrosTecnico(): void {
    // 1. Filtrar Incidencias
    this.incidenciasTecnicoFiltradas = this.incidenciasTecnico.filter(inc => {
      const matchNum = !this.filtroIncidencias.numero || (inc.numeroIncidencia && inc.numeroIncidencia.toLowerCase().includes(this.filtroIncidencias.numero.toLowerCase()));
      const matchPiso = !this.filtroIncidencias.piso || (inc.pisos?.piso && inc.pisos.piso.toLowerCase().includes(this.filtroIncidencias.piso.toLowerCase()));
      const matchEst = !this.filtroIncidencias.estado || (inc.estado && inc.estado.toLowerCase().includes(this.filtroIncidencias.estado.toLowerCase()));
      return matchNum && matchPiso && matchEst;
    });

    // 2. Filtrar Visitas
    this.visitasTecnicoFiltradas = this.visitasTecnico.filter(v => {
      const matchNum = !this.filtroVisitas.numero || (v.numeroIncidencia && v.numeroIncidencia.toLowerCase().includes(this.filtroVisitas.numero.toLowerCase()));
      const matchPiso = !this.filtroVisitas.piso || (v.piso && v.piso.toLowerCase().includes(this.filtroVisitas.piso.toLowerCase()));
      const matchEst = !this.filtroVisitas.estadoVisita || (v.estadoVisita && v.estadoVisita.toLowerCase().includes(this.filtroVisitas.estadoVisita.toLowerCase()));
      return matchNum && matchPiso && matchEst;
    });
  }

  limpiarFiltrosIncidencias(): void {
    this.filtroIncidencias = { numero: '', piso: '', estado: '' };
    this.aplicarFiltrosTecnico();
  }

  limpiarFiltrosVisitas(): void {
    this.filtroVisitas = { numero: '', piso: '', estadoVisita: '' };
    this.aplicarFiltrosTecnico();
  }
}
