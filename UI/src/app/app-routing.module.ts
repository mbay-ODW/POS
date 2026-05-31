import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductsComponent } from './products/products.component';
import { OrdersComponent } from './orders/orders.component';
import { SettingsComponent } from './settings/settings.component';
import { BookingComponent } from './booking/booking.component';
import { HomeComponent } from './home/home.component';
import { PreviewComponent } from './preview/preview.component';
import { CategoriesComponent } from './categories/categories.component';
import { StationsComponent } from './stations/stations.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { LoginComponent } from './login/login.component';
import { UsersComponent } from './users/users.component';
import { CustomerDisplayComponent } from './customer-display/customer-display.component';
import { AuthGuard } from './guards/auth.guard';
import { ManagerGuard } from './guards/manager.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'customer-display', component: CustomerDisplayComponent },
  { path: 'bookings',   component: BookingComponent,   canActivate: [AuthGuard] },
  { path: 'preview',    component: PreviewComponent,   canActivate: [AuthGuard] },
  { path: 'home',       component: HomeComponent,      canActivate: [AuthGuard] },
  { path: 'statistics', component: StatisticsComponent, canActivate: [AuthGuard, ManagerGuard] },
  { path: 'products',   component: ProductsComponent,  canActivate: [AuthGuard, ManagerGuard] },
  { path: 'orders',     component: OrdersComponent,    canActivate: [AuthGuard, ManagerGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [AuthGuard, ManagerGuard] },
  { path: 'stations',   component: StationsComponent,  canActivate: [AuthGuard, ManagerGuard] },
  { path: 'settings',   component: SettingsComponent,  canActivate: [AuthGuard, ManagerGuard] },
  { path: 'users',      component: UsersComponent,     canActivate: [AuthGuard, ManagerGuard] },
  { path: '', redirectTo: '/bookings', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
