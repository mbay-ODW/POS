import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Product } from '../../models/products';
import { ProductsService } from '../../services/products.service';
import { FormGroup, FormBuilder, FormControl,FormArray } from '@angular/forms';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css']
})
export class ProductEditComponent implements OnInit {
  editForm: FormGroup;
  imageFormControl = new FormControl('');
  @Input() productId!: string;
  @Input() product!: Product;
  @Input() base64Image!: string;
  @Input() type!: string;

  
  constructor(
    private productsService: ProductsService, 
    private snackBar: SnackbarService,
    private formBuilder: FormBuilder
            ) { 
      this['editForm'] = this.formBuilder.group({
      _id: [''],
      category: [''],
      name: [''],
      shortName: [''],
      active: [''],
      stock: this.formBuilder.group({
        current: ['']
      }),
      price: this.formBuilder.group({
        current: ['']
      }),
      thresholds: this.formBuilder.group({
        info: [''],
        warning: ['']
      }),
      image: this.imageFormControl,
      lastModified: [''],
      creationTime: ['']
    });
  }

  ngOnInit() {  
    if (this.productId){
    this.type = "Edit";
    this.productsService.getProductById(this.productId).subscribe(
      (product: Product) => {
        console.log(product)
        this.product = product;
        this['editForm'].patchValue(product);
      },
      (error) => {
        console.error('Error fetching product', error);
      }
    
    );
  } else {
    this.type = "Create";
  }
  
  }
  onSubmit() {
    const formValues = this.editForm.value;
    if (this.productId) {
      // Update existing product
      this.productsService.updateProduct(this.productId, formValues).subscribe(
        () => {
          this.productsService.productEdited.emit(true)
          this.snackBar.info('Product edited successfully');
        },
        (error) => {
          this.productsService.productEdited.emit(false)
          this.snackBar.error('Product edit failed:' + JSON.stringify(error));
        }
      );
    } else {
      // Create new product
      this.productsService.addProduct(formValues).subscribe(
        () => {
          this.productsService.productCreated.emit(true)
          this.snackBar.info('Product created successfully');
        },
        (error) => {
          this.productsService.productCreated.emit(false)
          this.snackBar.error('Product creation failed:' + JSON.stringify(error));

        }
      );
    }

  }

  
  handleFileInput(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = reader.result as string;
      this.imageFormControl.setValue(base64Image.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }
  

}

