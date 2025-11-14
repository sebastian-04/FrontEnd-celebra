import {ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CurrencyPipe, NgOptimizedImage} from "@angular/common";
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ProveedorServices} from '../../services/proveedor-services';
import {DistritoServices} from '../../services/distrito-services';
import {CiudadServices} from '../../services/ciudad-services';
import {TipoEventoServices} from '../../services/tipo-evento-services';
import {EventoService} from '../../services/evento-services';
import {ImagenEventoService} from '../../services/imagenEvento-services';
import {AnfitrionServices} from '../../services/anfitrion-services';
import {Distrito} from '../../model/distrito';
import {Ciudad} from '../../model/ciudad';
import {TipoEvento} from '../../model/tipoEvento';
import {ContratoEvento} from '../../model/contratoEvento';
import {ResenaEvento} from '../../model/resenaEvento';
import {Proveedor} from '../../model/proveedor';
import {ImagenEvento} from '../../model/imagenEvento';
import {startWith} from 'rxjs/operators';
import {GananciaProveedorDTO} from '../../model/gananciaProveedorDTO';
import {ReporteProveedorServices} from '../../services/reporte-proveedor-services';
import {Chart, ChartConfiguration, ChartType, registerables} from 'chart.js';

@Component({
  selector: 'app-reporte-proveedor',
  imports: [
    NgOptimizedImage,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './reporte-proveedores.html',
  styleUrl: './reporte-proveedores.css',
})
export class ReporteProveedores implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private route = inject(Router);
  private router = inject(ActivatedRoute);

  proveedorService: ProveedorServices = inject(ProveedorServices);
  distritoService = inject(DistritoServices);
  ciudadService = inject(CiudadServices);
  tipoEventoService = inject(TipoEventoServices);
  eventoService = inject(EventoService);
  imagenEventoService = inject(ImagenEventoService);
  anfitrionService = inject(AnfitrionServices);
  reporteProveedorService: ReporteProveedorServices = inject(ReporteProveedorServices);

  // Datos
  id: number = 0;
  gananciaTotal: number = 0;
  mesMenorGanancia: string = '';
  montoMenorGanancia: number = 0;
  mesMayorGanancia: string = '';
  montoMayorGanancia: number = 0;
  distrito: Distrito[] = [];
  ciudad: Ciudad[] = [];
  tipoEvento: TipoEvento[] = [];
  contratoEvento: ContratoEvento[] = [];
  resenaEvento: ResenaEvento[] = [];
  gananciaProveedor: GananciaProveedorDTO[] = [];
  proveedor: Proveedor;
  // Mapa de Imágenes y control de estado
  imagenesEvento: { [idEvento: number]: ImagenEvento[] } = {};
  indices: { [key: number]: number } = {};
  indicePrevio: { [key: number]: number } = {};
  currentChartData: GananciaProveedorDTO[] = [];
  // Formularios y UI
  buscarForm: FormGroup;
  buscarAvanzadaForm: FormGroup;
  historialForm!: FormGroup;
  mostrarFiltrosAvanzados = false;
  menuPerfilActivo = false;
  menuActivo = false;
  animando = false;
  mostrarCerrarSesion = false;

  private chart: Chart | undefined;
  private nombresMeses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  private chartColors = [
    '#D577FF', '#8138FF', '#E2C9FF', '#5A0B9D',
    '#BE93E4', '#7F00FF', '#CBA3E8', '#6A0DAD',
    '#DAB9F0', '#9047FF', '#E7D4F5', '#AB82FF'
  ];
  constructor() {
    Chart.register(...registerables);
  }
  ngOnInit(): void {
    const idParam = this.router.snapshot.params['id'];
    this.id = Number(idParam);

    this.cargarProveedor(this.id);

    this.historialForm = this.fb.group({
      filtro: ['ultimomes'],
      tipoGrafico: ['line']
    });

    this.historialForm.get('filtro')!.valueChanges
      .pipe(
        startWith(this.historialForm.get('filtro')!.value)
      ).subscribe(valorFiltro => {
      if (valorFiltro) {
        this.cargarDatosDelGrafico(valorFiltro);
      }
    });

    // 5. Suscripción al tipo de GRÁFICO (esto solo redibuja)
    this.historialForm.get('tipoGrafico')!.valueChanges
      .subscribe(() => {
        // Solo redibuja si ya tenemos datos
        if (this.currentChartData.length > 0) {
          this.renderizarGrafico();
        }
      });
  }
  cargarDatosDelGrafico(filtro: string): void {
    let servicioLlamado;

    // Selecciona el endpoint del servicio basado en el filtro
    switch (filtro) {
      // ... (tu switch está bien)
      case 'ultimomes':
        servicioLlamado = this.reporteProveedorService.reporteUltimoMes(this.id);
        break;
      case 'ultimos3meses':
        servicioLlamado = this.reporteProveedorService.reporteUltimoTresMeses(this.id);
        break;
      case 'ultimos6meses':
        servicioLlamado = this.reporteProveedorService.reporteUltimoSeisMeses(this.id);
        break;
      case 'ultimoanio':
        servicioLlamado = this.reporteProveedorService.reporteUltimoAnio(this.id);
        break;
      default:
        return;
    }

    servicioLlamado.subscribe({
      next: (data) => {
        // === LA CORRECCIÓN ESTÁ AQUÍ ===

        // 1. Guarda los datos en la variable de la clase
        this.currentChartData = data;

        // 2. Llama a renderizar (ahora sí, sin argumentos)
        this.renderizarGrafico();
      },
      error: (err) => {
        console.error('Error al cargar datos del reporte:', err);
        this.currentChartData = []; // Limpia en caso de error
        this.renderizarGrafico(); // Dibuja un gráfico vacío
      }
    });
  }
  renderizarGrafico(): void {
    // Destruye el gráfico anterior
    if (this.chart) {
      this.chart.destroy();
    }

    // Obtiene los datos y el tipo de gráfico
    const data = this.currentChartData;
    const tipoGrafico = this.historialForm.get('tipoGrafico')?.value || 'line';

    // Procesa los KPIs
    this.procesarKPIs(data);

    // Prepara etiquetas y valores
    const labels = data.map(d => `${this.nombresMeses[d.mes - 1]} ${d.anio}`);
    const valores = data.map(d => d.ganancia);

    let config: ChartConfiguration; // Configuración universal

    // 7. Genera la configuración específica
    if (tipoGrafico === 'pie') {
      config = this.getPieConfig(labels, valores);
    } else {
      config = this.getLineBarConfig(tipoGrafico, labels, valores);
    }

    // 8. Crea el gráfico
    this.chart = new Chart('graficoGanancias', config);
  }
  procesarKPIs(data: GananciaProveedorDTO[]): void {
    if (!data || data.length === 0) {
      this.gananciaTotal = 0;
      this.mesMenorGanancia = 'N/A';
      this.montoMenorGanancia = 0;
      this.mesMayorGanancia = 'N/A';
      this.montoMayorGanancia = 0;
      return;
    }

    this.gananciaTotal = data.reduce((sum, item) => sum + item.ganancia, 0);

    const maxGanancia = Math.max(...data.map(item => item.ganancia));
    const minGanancia = Math.min(...data.map(item => item.ganancia));

    const allMaxItems = data.filter(item => item.ganancia === maxGanancia);
    const allMinItems = data.filter(item => item.ganancia === minGanancia);

    const maxMonthStrings = allMaxItems.map(item => `${this.nombresMeses[item.mes - 1]} ${item.anio}`);
    const minMonthStrings = allMinItems.map(item => `${this.nombresMeses[item.mes - 1]} ${item.anio}`);

    this.mesMayorGanancia = this.formatarMeses(maxMonthStrings);
    this.montoMayorGanancia = maxGanancia;
    this.mesMenorGanancia = this.formatarMeses(minMonthStrings);
    this.montoMenorGanancia = minGanancia;
  }
  private getLineBarConfig(tipo: ChartType, labels: string[], valores: number[]): ChartConfiguration {
    return {
      type: tipo,
      data: {
        labels: labels,
        datasets: [{
          label: 'Ganancias Netas',
          data: valores,
          fill: tipo === 'line' ? false : true,
          borderColor: '#D577FF',
          backgroundColor: tipo === 'line' ? '#D577FF' : 'rgba(213, 119, 255, 0.6)',
          tension: 0.1,
          pointRadius: 5,
          pointBackgroundColor: '#D577FF',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#FFFFFF',
          pointHoverBorderColor: '#D577FF',
          pointHoverBorderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { // <-- Los gráficos de línea/barra SÍ tienen escalas
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (typeof value === 'number') {
                  return 'S/ ' + value.toLocaleString('es-PE');
                }
                return value;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += 'S/ ' + context.parsed.y.toLocaleString('es-PE');
                }
                return label;
              }
            }
          }
        },
        hover: {
          mode: 'index',
          intersect: false,
        },
      }
    };
  }
  private getPieConfig(labels: string[], valores: number[]): ChartConfiguration {
    return {
      type: 'pie',
      data: {
        labels: labels, // Los meses
        datasets: [{
          label: 'Ganancias',
          data: valores,
          backgroundColor: this.chartColors.slice(0, valores.length), // Asigna un color a cada "quesito"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Los gráficos de torta NO tienen escalas (scales)
        plugins: {
          tooltip: {
            callbacks: {
              // Tooltip personalizado para mostrar porcentaje
              label: (context) => {
                const total = context.chart.data.datasets[0].data.reduce((a, b) => (a as number) + (b as number), 0) as number;
                const value = context.parsed as number;
                const percentage = ((value / total) * 100).toFixed(1);
                const monto = 'S/ ' + value.toLocaleString('es-PE');

                return `${context.label}: ${monto} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
  }
  private formatarMeses(meses: string[]): string {
    if (meses.length === 1) {
      return meses[0];
    }
    if (meses.length === 2) {
      return meses.join(' y ');
    }
    return meses.join(', ');
  }
  ngOnDestroy(): void {
    this.chart?.destroy();
  }
  cargarProveedor(id: number): void {
    this.proveedorService.listarPorId(id).subscribe({
      next: (data) => {
        this.proveedor = data;
        if (this.proveedor.foto && !this.proveedor.foto.startsWith('data:')) {
          this.proveedor.foto = 'data:image/png;base64,' + this.proveedor.foto;
        }
      },
      error: (err) => console.error('Error al cargar proveedor', err)
    });
  }
  toggleMenu() {
    if (this.animando) return;
    this.animando = true;
    this.menuActivo = !this.menuActivo;
    const menu = document.querySelector('.menu-hamburguesa-text');
    const boton = document.querySelector('.menu-hamburguesa-boton');

    if (this.menuActivo) {
      menu?.classList.remove('saliendo'); menu?.classList.add('activo');
      boton?.classList.add('activo');
    } else {
      menu?.classList.remove('activo'); menu?.classList.add('saliendo');
      boton?.classList.remove('activo');
    }
    setTimeout(() => (this.animando = false), 600);
  }
  toggleMenuPerfil() {
    if (this.animando) return;
    this.animando = true;
    this.menuPerfilActivo = !this.menuPerfilActivo;
    const menuPerfil = document.querySelector('.encabezado-perfil-menu');
    if (this.menuPerfilActivo) {
      menuPerfil?.classList.remove('saliendo'); menuPerfil?.classList.add('activo');
    } else {
      menuPerfil?.classList.remove('activo'); menuPerfil?.classList.add('saliendo');
    }
    setTimeout(() => (this.animando = false), 600);
  }
  abrirModalCerrarSesion() {
    this.mostrarCerrarSesion = true;
    document.body.classList.add('modal-abierto');
  }

  confirmarCerrarSesion(event: MouseEvent) {
    event.stopPropagation();
    this.mostrarCerrarSesion = false;
    document.body.classList.remove('modal-abierto');
  }

  cancelarCerrarSesion(event: MouseEvent) {
    event.stopPropagation();
    this.mostrarCerrarSesion = false;
    document.body.classList.remove('modal-abierto');
  }

  cerrarSesion() {
    this.mostrarCerrarSesion = false;
  }
}
