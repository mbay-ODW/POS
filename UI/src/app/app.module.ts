import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MAT_DATE_LOCALE } from '@angular/material/core'
import { AuthInterceptor } from './auth.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProductsComponent } from './products/products.component';
import { SettingsComponent } from './settings/settings.component';
import { OrdersComponent } from './orders/orders.component';
import { MatCardModule } from '@angular/material/card'; 
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule} from '@angular/material/dialog';
import { DialogsComponent } from './dialogs/dialogs.component';
import { DeleteComponent } from './dialogs/delete/delete.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductEditComponent } from './products/product-edit/product-edit.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatBadgeModule } from '@angular/material/badge';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { OrderEditComponent } from './orders/order-edit/order-edit.component';
import { SettingEditComponent } from './settings/setting-edit/setting-edit.component';
import { CartComponent } from './cart/cart.component';
import { BookingComponent } from './booking/booking.component';
import { NavigationComponent } from './navigation/navigation.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ProductViewComponent } from './products/product-view/product-view.component';
import { CategoriesComponent } from './categories/categories.component';
import { StationsComponent } from './stations/stations.component';
import { PreviewComponent } from './preview/preview.component';
import { SettingViewComponent } from './settings/setting-view/setting-view.component';
import { CategoryEditComponent } from './categories/category-edit/category-edit.component';
import { CategoryViewComponent } from './categories/category-view/category-view.component';
import { StationEditComponent } from './stations/station-edit/station-edit.component';
import { StationViewComponent } from './stations/station-view/station-view.component';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatisticsComponent } from './statistics/statistics.component';



@NgModule({ declarations: [
        AppComponent,
        ProductsComponent,
        SettingsComponent,
        OrdersComponent,
        DialogsComponent,
        DeleteComponent,
        ProductEditComponent,
        OrderEditComponent,
        SettingEditComponent,
        CartComponent,
        BookingComponent,
        NavigationComponent,
        ProductViewComponent,
        CategoriesComponent,
        StationsComponent,
        PreviewComponent,
        SettingViewComponent,
        CategoriesComponent,
        CategoryEditComponent,
        CategoryViewComponent,
        StationsComponent,
        StationEditComponent,
        StationViewComponent,
        StatisticsComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatMenuModule,
        MatButtonModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatSlideToggleModule,
        MatBadgeModule,
        MatAutocompleteModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatTableModule,
        MatSortModule,
        MatToolbarModule,
        MatSidenavModule,
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatListModule,
        MatTooltipModule], providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, { provide: MAT_DATE_LOCALE, useValue: 'de-DE' }, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }




