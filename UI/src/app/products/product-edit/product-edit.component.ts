import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Product } from '../../interfaces/product';
import { ProductsService } from 'src/app/services/products.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from 'src/app/services/notification.service';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';



@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css']
})
export class ProductEditComponent implements OnInit{
  categoryControl = new FormControl();
  filteredCategories!: Observable<string[]>;
  categories: string[] = []; 
  product: Product[] = [];
  form: FormGroup;
  editingProduct: Product | null = null;
  imagePreview: string | null = null;

  isActive: boolean = false; // Add this line


  ngOnInit(): void {
    this.form.patchValue(this.data.product);
    this.isActive = this.data.product?.active || false; // Handle the case when the product is null
    this.editingProduct = this.data.product;
    this.filteredCategories = this.categoryControl.valueChanges
    .pipe(
      startWith(''),
      map(value => this._filter(value))
    );
    // Set the value of the categoryControl
    if (this.data.product?.category) {
      this.categoryControl.setValue(this.data.product.category);
    }
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.categories.filter(option => option.toLowerCase().includes(filterValue));
  }

  constructor(
    private fb: FormBuilder,
    private productsService: ProductsService,
    public dialogRef: MatDialogRef<ProductEditComponent>,
    private   notification: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: { product: Product, categories : string [] },
  

    ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      category: this.categoryControl,
      label: [''],
      active: [false],
      stock: this.fb.group({
        current: [0, Validators.required],
                          }),
      price: this.fb.group({
        current: [0, Validators.required],
                          }),
      image: [''],
      thresholds: this.fb.group({
        warning: [0],
        info: [0]
                                }),
      schemaVersion: [''],
      lastModified: [''],
      creationTime: ['']

    }); 
    this.categories = data.categories;
  }

  onSave(): void {
    console.log(this.form)
    if (this.form.valid) {
      const product: Product = this.form.value;

      this.dialogRef.close(product);
    } else {
      // Handle form validation error
    }
  }
  

  onCancel(): void {
    // If you want to navigate away from the form, you can inject Router and navigate
    // this.router.navigate(['/some-path']);
  
    // If you want to reset the form to its initial state
    this.form.reset();
    this.dialogRef.close(false);
  }


  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement?.files?.item(0);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Create an image element to load the selected file
          const image = new Image();
          image.onload = () => {
            // Define the desired thumbnail size
            const thumbnailSize = 300;
            // Create a canvas element to resize the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Calculate the scaling factor to maintain the aspect ratio
              const scalingFactor = thumbnailSize / Math.max(image.width, image.height);
              // Set the canvas size based on the scaling factor
              canvas.width = image.width * scalingFactor;
              canvas.height = image.height * scalingFactor;
              // Draw the resized image on the canvas
              ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
              // Convert the canvas content to a Base64 string
              const base64Thumbnail = canvas.toDataURL(file.type);
              this.imagePreview = base64Thumbnail;

              if (this.editingProduct) {
                this.editingProduct.image = base64Thumbnail;
              }
              this.form.controls['image'].setValue(base64Thumbnail);
            }
          };
          // Load the selected file into the image element
          image.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }


}
