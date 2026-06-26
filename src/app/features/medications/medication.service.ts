import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CreateMedicationDto,
  Medication,
  PaginatedResponse,
} from '../../core/models/medication.model';

export interface MedicationQuery {
  page: number;
  limit: number;
  name?: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class MedicationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/medications`;

  getAll(query: MedicationQuery): Observable<PaginatedResponse<Medication>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit);
    if (query.name) {
      params = params.set('name', query.name);
    }
    if (query.category) {
      params = params.set('category', query.category);
    }
    return this.http.get<PaginatedResponse<Medication>>(this.base, { params });
  }

  search(q: string): Observable<ApiResponse<Medication[]>> {
    const params = new HttpParams().set('q', q);
    return this.http.get<ApiResponse<Medication[]>>(`${this.base}/search`, {
      params,
    });
  }

  getById(id: string): Observable<ApiResponse<Medication>> {
    return this.http.get<ApiResponse<Medication>>(`${this.base}/${id}`);
  }

  create(dto: CreateMedicationDto): Observable<ApiResponse<Medication>> {
    return this.http.post<ApiResponse<Medication>>(this.base, dto);
  }

  update(
    id: string,
    dto: Partial<CreateMedicationDto>,
  ): Observable<ApiResponse<Medication>> {
    return this.http.put<ApiResponse<Medication>>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    // El backend responde 204 sin body.
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
