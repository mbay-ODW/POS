import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CartComponent } from './cart/cart.component';
import { OrdersComponent } from './orders/orders.component';
import { ProductsComponent } from './products/products.component';
import { SettingsComponent } from './settings/settings.component';
import { ProductEditComponent } from './products/product-edit/product-edit.component';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { ProductDeleteComponent } from './products/product-delete/product-delete.component';
import { OrderPrintComponent } from './orders/order-print/order-print.component';
import { OrderEditComponent } from './orders/order-edit/order-edit.component';
import { OrderDeleteComponent } from './orders/order-delete/order-delete.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { HomeComponent } from './home/home.component';
import { BookingComponent } from './booking/booking.component';
import { BookingCardComponent } from './booking/booking-card/booking-card.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PreviewComponent } from './preview/preview.component';
import { PreviewCardComponent } from './preview/preview-card/preview-card.component';
import { IconsComponent } from './icons/icons.component';
import { ValidationComponent } from './validation/validation.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';




@NgModule({
  declarations: [
    AppComponent,
    CartComponent,
    OrdersComponent,
    ProductsComponent,
    SettingsComponent,
    ProductEditComponent,
    ProductDeleteComponent,
    OrderPrintComponent,
    OrderEditComponent,
    OrderDeleteComponent,
    HomeComponent,
    BookingComponent,
    BookingCardComponent,
    PreviewComponent,
    PreviewCardComponent,
    IconsComponent,
    ValidationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatIconModule,
    FontAwesomeModule,
    MatSnackBarModule,
    MatMenuModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  exports: [
    ProductsComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { 

}
