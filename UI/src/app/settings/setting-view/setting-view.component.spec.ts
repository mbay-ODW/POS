import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingViewComponent } from './setting-view.component';

describe('SettingViewComponent', () => {
  let component: SettingViewComponent;
  let fixture: ComponentFixture<SettingViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SettingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
