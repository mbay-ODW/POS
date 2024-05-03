import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductsComponent } from './products/products.component';
import { OrdersComponent } from './orders/orders.component';
import { SettingsComponent } from './settings/settings.component';
import { BookingComponent } from './booking/booking.component';

const routes: Routes = [
  {path: "products", component: ProductsComponent},
  {path: "orders", component: OrdersComponent},
  {path: "settings", component: SettingsComponent},
  {path: "bookings", component: BookingComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
