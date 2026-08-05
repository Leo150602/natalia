import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../servicios/auth-service';
import { AlertaService } from '../../servicios/alerta-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  cargando = false;
  verPassword = false;

  constructor(
    private authService: AuthService,
    private alertaService: AlertaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    } else {
      this.authService.verificarSesion().subscribe({
        next: (user) => {
          if (user && user.succes) {
            this.router.navigate(['/']);
          }
        }
      });
    }
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.alertaService.advertencia('Por favor complete todos los campos.', 'Campos Vacíos');
      return;
    }

    this.cargando = true;
    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.cargando = false;
        this.cdr.detectChanges();
        if (res.succes) {
          this.router.navigate(['/']);
        } else {
          this.alertaService.error('Usuario o contraseña incorrectos.', 'Acceso Denegado');
        }
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.alertaService.error('Usuario o contraseña incorrectos.', 'Acceso Denegado');
      }
    });
  }
}
