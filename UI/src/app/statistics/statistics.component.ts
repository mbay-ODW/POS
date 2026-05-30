import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { StatisticsService, StatisticsData } from '../services/statistics.service';
import { StationsService } from '../services/stations.service';
import { Station } from '../interfaces/station';
import {
  Chart, ChartConfiguration,
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend,
  DoughnutController, BarController, LineController
} from 'chart.js';

Chart.register(
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend,
  DoughnutController, BarController, LineController
);

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const PALETTE = [
  '#1976d2','#42a5f5','#26c6da','#66bb6a','#ffa726',
  '#ef5350','#ab47bc','#78909c','#26a69a','#d4e157',
  '#ff7043','#8d6e63','#7e57c2','#29b6f6','#9ccc65',
  '#ffca28','#ec407a','#5c6bc0','#26c6da','#bdbdbd',
];

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css',
  standalone: false
})
export class StatisticsComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('donutCanvas') donutRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hourCanvas')  hourRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('dayCanvas')   dayRef!:   ElementRef<HTMLCanvasElement>;

  filterForm: FormGroup;
  stations: Station[] = [];
  data: StatisticsData | null = null;
  isLoading = false;

  heatmapCells: { weekday: number; hour: number; count: number; level: number }[] = [];
  heatmapMax = 0;
  weekdays = WEEKDAYS;
  hours = Array.from({ length: 24 }, (_, i) => i);

  private donutChart?: Chart;
  private hourChart?: Chart;
  private dayChart?: Chart;

  constructor(
    private fb: FormBuilder,
    private statsService: StatisticsService,
    private stationService: StationsService,
    private cdr: ChangeDetectorRef,
  ) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.filterForm = this.fb.group({
      from: [this.toDateString(thirtyDaysAgo)],
      to:   [this.toDateString(today)],
      station_id: [''],
    });
  }

  ngOnInit(): void {
    this.stationService.getStations().subscribe(r => this.stations = r.data);
    this.load();
  }

  ngAfterViewInit(): void {}

  load(): void {
    this.isLoading = true;
    const { from, to, station_id } = this.filterForm.value;
    const params: any = {};
    if (from) params.from = new Date(from).toISOString();
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      params.to = d.toISOString();
    }
    if (station_id) params.station_id = station_id;

    this.statsService.getStatistics(params).subscribe({
      next: (d) => {
        this.data = d;
        this.buildHeatmap(d);
        this.isLoading = false;
        this.cdr.detectChanges();
        // wait one tick for canvas to render
        setTimeout(() => this.renderCharts(d), 0);
      },
      error: () => { this.isLoading = false; }
    });
  }

  private buildHeatmap(d: StatisticsData): void {
    const map = new Map<string, number>();
    for (const cell of d.heatmap) {
      map.set(`${cell.weekday}-${cell.hour}`, cell.count);
    }
    this.heatmapMax = d.heatmap.reduce((m, c) => Math.max(m, c.count), 1);
    this.heatmapCells = [];
    for (let wd = 0; wd < 7; wd++) {
      for (let h = 0; h < 24; h++) {
        const count = map.get(`${wd}-${h}`) ?? 0;
        this.heatmapCells.push({ weekday: wd, hour: h, count, level: count / this.heatmapMax });
      }
    }
  }

  private renderCharts(d: StatisticsData): void {
    this.renderDonut(d);
    this.renderHour(d);
    this.renderDay(d);
  }

  private renderDonut(d: StatisticsData): void {
    this.donutChart?.destroy();
    if (!this.donutRef) return;
    const top = d.products.slice(0, 10);
    this.donutChart = new Chart(this.donutRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: top.map(p => p.name),
        datasets: [{
          data: top.map(p => p.total_amount),
          backgroundColor: PALETTE.slice(0, top.length),
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} Stk`
            }
          }
        }
      }
    });
  }

  private renderHour(d: StatisticsData): void {
    this.hourChart?.destroy();
    if (!this.hourRef) return;
    this.hourChart = new Chart(this.hourRef.nativeElement, {
      type: 'bar',
      data: {
        labels: d.orders_by_hour.map(h => `${h.hour}:00`),
        datasets: [{
          label: 'Bestellungen',
          data: d.orders_by_hour.map(h => h.count),
          backgroundColor: '#1976d2',
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  private renderDay(d: StatisticsData): void {
    this.dayChart?.destroy();
    if (!this.dayRef) return;
    this.dayChart = new Chart(this.dayRef.nativeElement, {
      type: 'line',
      data: {
        labels: d.orders_by_day.map(x => x.date),
        datasets: [{
          label: 'Bestellungen',
          data: d.orders_by_day.map(x => x.count),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25,118,210,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  heatmapColor(level: number): string {
    const l = Math.round(level * 100);
    if (l === 0) return '#f5f5f5';
    const r = Math.round(25 + (210 - 25) * (1 - level));
    const g = Math.round(118 + (118 - 245) * level);
    const b = Math.round(210 + (25 - 210) * level);
    // gradient: light blue → deep blue
    const alpha = 0.15 + level * 0.85;
    return `rgba(25, 118, 210, ${alpha.toFixed(2)})`;
  }

  getCell(weekday: number, hour: number) {
    return this.heatmapCells.find(c => c.weekday === weekday && c.hour === hour);
  }

  private toDateString(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.donutChart?.destroy();
    this.hourChart?.destroy();
    this.dayChart?.destroy();
  }
}
