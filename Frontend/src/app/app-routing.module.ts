import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductsComponent } from './products/products.component';
import { OrdersComponent } from './orders/orders.component';
import { SettingsComponent } from './settings/settings.component';
import { HomeComponent } from './home/home.component';
import { BookingComponent } from './booking/booking.component';
import { PreviewComponent } from './preview/preview.component';


const routes: Routes = [
  {path: "products", component: ProductsComponent},
  {path: "home", component: HomeComponent},
  {path: "orders", component: OrdersComponent},
  {path: "booking", component: BookingComponent},
  {path: "settings", component: SettingsComponent},
  {path: "preview", component: PreviewComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
