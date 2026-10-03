import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MealResponse } from '../models/meal.model';

@Injectable({ providedIn: 'root' })
export class MealService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiBaseUrl}/meals`;

  getMeals(): Observable<MealResponse[]> {
    return this.http.get<MealResponse[]>(this.apiUrl);
  }

  getMealById(id: string): Observable<MealResponse> {
    return this.http.get<MealResponse>(`${this.apiUrl}/${id}`);
  }
}
