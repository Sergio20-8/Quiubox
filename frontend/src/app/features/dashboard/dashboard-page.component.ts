import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import type { DashboardStats, Scan } from '../../core/models/domain.models';
import { ResultsApiService } from '../../core/services/results-api.service';
import { ScanEventsService } from '../../core/services/scan-events.service';
import { ScansApiService } from '../../core/services/scans-api.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  private readonly scansApi = inject(ScansApiService);
  private readonly resultsApi = inject(ResultsApiService);
  private readonly scanEvents = inject(ScanEventsService);
  private readonly destroyRef = inject(DestroyRef);

  stats: DashboardStats | null = null;
  recentScans: Scan[] = [];
  activeScans: Scan[] = [];
  completedScans: Scan[] = [];
  totalScans = 0;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.load();

    this.scanEvents
      .scanFinished()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: () => undefined,
      });
  }

  load(): void {
    this.loading = true;
    this.error = null;
    forkJoin({
      scans: this.scansApi.listScans(),
      completed: this.resultsApi.listScansWithFilters({ scanType: 'all' }),
    }).subscribe({
      next: ({ scans, completed }) => {
        this.totalScans = scans.length;
        this.completedScans = completed;
        this.activeScans = scans.filter((scan) => scan.status === 'queued' || scan.status === 'running');
        this.recentScans = [...scans]
          .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
          .slice(0, 5);
        this.stats = this.computeStats(completed);
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las métricas';
        this.loading = false;
      },
    });
  }

  riskPercent(value: number): number {
    const total = this.stats?.totalVulnerabilities ?? 0;
    if (total <= 0) {
      return 0;
    }
    return Math.round((value / total) * 100);
  }

  statusLabel(status: Scan['status']): string {
    switch (status) {
      case 'queued':
        return 'En cola';
      case 'running':
        return 'En ejecución';
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  }

  scanTypeLabel(scanType: Scan['scanType']): string {
    switch (scanType) {
      case 'nmap':
        return 'Nmap';
      case 'openvas':
        return 'OpenVAS';
      case 'combined':
        return 'Combinado';
      default:
        return scanType;
    }
  }

  private computeStats(completed: Scan[]): DashboardStats {
    const critical = completed.reduce((total, scan) => total + scan.criticalCount, 0);
    const medium = completed.reduce((total, scan) => total + scan.mediumCount, 0);
    const low = completed.reduce((total, scan) => total + scan.lowCount, 0);
    const last = [...completed].sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))[0];
    return {
      totalVulnerabilities: critical + medium + low,
      critical,
      medium,
      low,
      lastScanAt: last?.finishedAt ?? null,
      lastScanId: last?.id ?? null,
    };
  }
}
