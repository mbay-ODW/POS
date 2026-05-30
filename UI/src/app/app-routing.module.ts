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

const routes: Routes = [
  {path: "products", component: ProductsComponent},
  {path: "orders", component: OrdersComponent},
  {path: "settings", component: SettingsComponent},
  {path: "bookings", component: BookingComponent},
  {path: "home", component: HomeComponent},
  {path: "preview", component: PreviewComponent},
  {path: "categories", component: CategoriesComponent},
  {path: "stations", component: StationsComponent},
  {path: "statistics", component: StatisticsComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
