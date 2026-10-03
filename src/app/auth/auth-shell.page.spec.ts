import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthShellPage } from './auth-shell.page';

describe('AuthShellPage', () => {
  let component: AuthShellPage;
  let fixture: ComponentFixture<AuthShellPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthShellPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthShellPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
