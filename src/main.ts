import { bootstrapApplication } from '@angular/platform-browser';
import { Chart, registerables } from 'chart.js';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Registra controllers, escalas y elementos de Chart.js (ng2-charts v5).
Chart.register(...registerables);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
