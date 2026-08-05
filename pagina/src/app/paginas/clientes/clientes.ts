import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientesService } from '../../servicios/clientes-service';
import { AlertaService } from '../../servicios/alerta-service';
import { PermisosService } from '../../servicios/permisos.service';
import { TablaDatosComponent } from '../../utils/tabla-datos/tabla-datos';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, TablaDatosComponent],
  templateUrl: './clientes.html'
})
export class ClientesComponent implements OnInit {
  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  cargando = false;

  filtroUsername = '';
  filtroNombre = '';

  config = {
    idCampo: 'username',
    idNombre: 'Cliente (Login)',
    mostrarId: true,
    columnas: [
      { campo: 'nombre', nombre: 'Nombre Completo' },
      { campo: 'correo', nombre: 'Correo Electrónico' },
      { campo: 'telefono', nombre: 'Teléfono' },
      { campo: 'nombrePromotora', nombre: 'Promotora Relacionada' },
      { campo: 'activoText', nombre: 'Estado' }
    ]
  };

  constructor(
    private clientesService: ClientesService,
    private alertaService: AlertaService,
    private router: Router,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeAdministrarClientes()) {
      this.router.navigate(['/']);
      return;
    }
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.clientesService.listar().subscribe({
      next: (res) => {
        this.cargando = false;
        this.clientes = res.map(c => ({
          ...c,
          activoText: c.activo !== false ? 'Activo' : 'Inactivo'
        }));
        this.aplicarFiltros();
      },
      error: (err) => {
        this.cargando = false;
        this.alertaService.error("Error al obtener la lista de clientes: " + (err.error || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    this.clientesFiltrados = this.clientes.filter(c => {
      const matchUser = !this.filtroUsername.trim() || (c.username && c.username.toLowerCase().includes(this.filtroUsername.toLowerCase()));
      const matchName = !this.filtroNombre.trim() || (c.nombre && c.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase()));
      return matchUser && matchName;
    });
    this.cdr.detectChanges();
  }

  limpiarFiltros(): void {
    this.filtroUsername = '';
    this.filtroNombre = '';
    this.aplicarFiltros();
  }

  editarCliente(c: any): void {
    this.router.navigate(['/importar-clientes'], { state: { clienteParaEditar: c } });
  }

  eliminarCliente(c: any): void {
    if (!c || !c.id) return;

    this.alertaService.confirmar(
      "¿Eliminar Cliente?", 
      `¿Está seguro de que desea eliminar permanentemente al cliente "${c.username}"?`,
      "Sí, eliminar"
    ).then((confirmado) => {
      if (confirmado) {
        this.clientesService.eliminar(c.id).subscribe({
          next: () => {
            this.alertaService.exito("Cliente eliminado con éxito.");
            this.cargarClientes();
          },
          error: (err) => {
            this.alertaService.error("Error al eliminar cliente: " + (err.error || err.message));
          }
        });
      }
    });
  }
}
