import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDeleteComponent } from './order-delete.component';

describe('OrderDeleteComponent', () => {
  let component: OrderDeleteComponent;
  let fixture: ComponentFixture<OrderDeleteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderDeleteComponent]
    });
    fixture = TestBed.createComponent(OrderDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
