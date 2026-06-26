import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/medication.model';
import { KpiResponse, TopSoldItem } from '../../core/models/kpi.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dashboard`;

  getKpis(): Observable<ApiResponse<KpiResponse>> {
    return this.http.get<ApiResponse<KpiResponse>>(`${this.base}/kpis`);
  }

  getTopSold(): Observable<ApiResponse<TopSoldItem[]>> {
    return this.http.get<ApiResponse<TopSoldItem[]>>(`${this.base}/top-sold`);
  }
}
