import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/medication.model';
import { CreateSaleDto } from '../../core/models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/sales`;

  processSale(dto: CreateSaleDto): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(this.base, dto);
  }
}
