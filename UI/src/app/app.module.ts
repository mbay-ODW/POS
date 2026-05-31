import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { AuthInterceptor } from './auth.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Feature Components
import { ProductsComponent } from './products/products.component';
import { ProductEditComponent } from './products/product-edit/product-edit.component';
import { ProductViewComponent } from './products/product-view/product-view.component';
import { SettingsComponent } from './settings/settings.component';
import { SettingEditComponent } from './settings/setting-edit/setting-edit.component';
import { SettingViewComponent } from './settings/setting-view/setting-view.component';
import { OrdersComponent } from './orders/orders.component';
import { OrderEditComponent } from './orders/order-edit/order-edit.component';
import { CategoriesComponent } from './categories/categories.component';
import { CategoryEditComponent } from './categories/category-edit/category-edit.component';
import { CategoryViewComponent } from './categories/category-view/category-view.component';
import { StationsComponent } from './stations/stations.component';
import { StationEditComponent } from './stations/station-edit/station-edit.component';
import { StationViewComponent } from './stations/station-view/station-view.component';
import { BookingComponent } from './booking/booking.component';
import { PreviewComponent } from './preview/preview.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { LoginComponent } from './login/login.component';
import { UsersComponent } from './users/users.component';
import { HomeComponent } from './home/home.component';
import { CartComponent } from './cart/cart.component';
import { NavigationComponent } from './navigation/navigation.component';
import { DialogsComponent } from './dialogs/dialogs.component';
import { DeleteComponent } from './dialogs/delete/delete.component';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatBadgeModule } from '@angular/material/badge';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    ProductsComponent, ProductEditComponent, ProductViewComponent,
    SettingsComponent, SettingEditComponent, SettingViewComponent,
    OrdersComponent, OrderEditComponent,
    CategoriesComponent, CategoryEditComponent, CategoryViewComponent,
    StationsComponent, StationEditComponent, StationViewComponent,
    BookingComponent,
    PreviewComponent,
    StatisticsComponent,
    LoginComponent,
    UsersComponent,
    HomeComponent,
    CartComponent,
    NavigationComponent,
    DialogsComponent, DeleteComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatCardModule, MatIconModule, MatMenuModule, MatButtonModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule,
    MatBadgeModule, MatAutocompleteModule, MatPaginatorModule,
    MatProgressBarModule, MatTableModule, MatSortModule,
    MatToolbarModule, MatSidenavModule, MatSelectModule,
    MatListModule, MatTooltipModule, MatTabsModule, MatDividerModule, DragDropModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    provideHttpClient(withInterceptorsFromDi()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
