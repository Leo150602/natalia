import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from './utils/navbar/navbar'; 
import { Sidebar } from './utils/sidebar/sidebar';
import { EstadoGlobalService } from './servicios/global-service';
import { AuthService } from './servicios/auth-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  sidebarColapsado = false;

  constructor(
    public authService: AuthService,
    private globalState: EstadoGlobalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (window.innerWidth <= 768) {
      this.globalState.setSidebarColapsado(true);
    }
    this.globalState.sidebarColapsado$.subscribe(val => {
      this.sidebarColapsado = val;
      this.cdr.detectChanges();
    });
  }

  cerrarSidebar(): void {
    this.globalState.setSidebarColapsado(true);
  }
}
