import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientesService } from '../../../servicios/clientes-service';
import { PromotorasService } from '../../../servicios/promotoras-service';
import { AlertaService } from '../../../servicios/alerta-service';
import { PermisosService } from '../../../servicios/permisos.service';
import { PromotorasRespuesta } from '../../../modelos/promotoras.model';

@Component({
  selector: 'app-detalle-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss'
})
export class DetalleClienteComponent implements OnInit {

  usuarioId!: number;
  cargando = false;
  puedeEditar = false;
  modoCrear = false;
  modoEdicion = false;

  cliente: any = {
    username: '',
    password: '',
    nombre: '',
    telefono: '',
    correo: '',
    activo: true,
    idPromotora: null,
    rol: 'CLIENTE'
  };

  // Variables para autocompletar Promotora
  busquedaPromotora = '';
  mostrarDropdownPromotora = false;
  promotoras: PromotorasRespuesta[] = [];
  promotorasFiltradas: PromotorasRespuesta[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private promotorasService: PromotorasService,
    private alertaService: AlertaService,
    public permisosService: PermisosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.permisosService.puedeAdministrarClientes()) {
      this.router.navigate(['/clientes']);
      return;
    }

    this.puedeEditar = this.permisosService.puedeInsertarEditar();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/clientes']);
      return;
    }

    this.cargarPromotoras();

    if (idParam === 'nuevo') {
      this.modoCrear = true;
      this.modoEdicion = true;
      this.cliente = {
        username: '',
        password: '',
        nombre: '',
        telefono: '',
        correo: '',
        activo: true,
        idPromotora: null,
        rol: 'CLIENTE'
      };
    } else {
      this.usuarioId = Number(idParam);
    }
  }

  cargarPromotoras(): void {
    this.promotorasService.obtenerTodas().subscribe({
      next: (res) => {
        this.promotoras = res || [];
        this.promotorasFiltradas = [...this.promotoras];
        if (!this.modoCrear) {
          this.cargarDatosCliente();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar promotoras:", err)
    });
  }

  cargarDatosCliente(): void {
    this.cargando = true;
    this.clientesService.listar().subscribe({
      next: (res) => {
        const found = res.find(c => c.id === this.usuarioId);
        if (found) {
          this.cliente = {
            username: found.username || '',
            password: '',
            nombre: found.nombre || '',
            telefono: found.telefono || '',
            correo: found.correo || '',
            activo: found.activo !== false,
            idPromotora: found.idPromotora || null,
            rol: 'CLIENTE'
          };

          if (found.idPromotora) {
            const match = this.promotoras.find(p => p.idPromotora === found.idPromotora);
            if (match) {
              this.busquedaPromotora = match.promotora.toUpperCase();
            } else {
              this.promotorasService.obtenerPorId(found.idPromotora).subscribe({
                next: (p) => {
                  this.busquedaPromotora = p.promotora.toUpperCase();
                  this.cdr.detectChanges();
                }
              });
            }
          }
        } else {
          this.alertaService.error("No se pudo encontrar el cliente especificado.");
          this.router.navigate(['/clientes']);
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar cliente:", err);
        this.cargando = false;
        this.alertaService.error("No se pudo cargar la información del cliente.");
        this.router.navigate(['/clientes']);
      }
    });
  }

  // --- Lógica del Dropdown de Promotoras Autocompletable ---

  abrirDropdownPromotora(): void {
    if (!this.puedeEditar) return;
    this.mostrarDropdownPromotora = true;
    this.promotorasFiltradas = [...this.promotoras]; // Muestra siempre todos al dar click/focus
    this.cdr.detectChanges();
  }

  cerrarDropdownPromotora(): void {
    setTimeout(() => {
      this.mostrarDropdownPromotora = false;
      // Sincroniza el valor escrito (aunque sea nuevo) con la promotora seleccionada
      const query = this.busquedaPromotora.trim().toUpperCase();
      const match = this.promotoras.find(p => p.promotora.toUpperCase() === query);
      if (match) {
        this.cliente.idPromotora = match.idPromotora;
        this.busquedaPromotora = match.promotora;
      }
      this.cdr.detectChanges();
    }, 150);
  }

  filtrarPromotoras(): void {
    const query = this.busquedaPromotora ? this.busquedaPromotora.toLowerCase() : '';
    const match = this.promotoras.find(p => p.idPromotora === this.cliente.idPromotora);
    const selectedText = match ? match.promotora : '';

    // Si coincide con la selección actual, mostramos todos
    if (match && selectedText.toLowerCase() === query) {
      this.promotorasFiltradas = [...this.promotoras];
    } else {
      this.promotorasFiltradas = this.promotoras.filter(p =>
        p.promotora && p.promotora.toLowerCase().includes(query)
      );
    }
  }

  seleccionarPromotora(p: PromotorasRespuesta): void {
    this.cliente.idPromotora = p.idPromotora;
    this.busquedaPromotora = p.promotora.toUpperCase();
    this.mostrarDropdownPromotora = false;
  }

  // --- Operaciones CRUD ---

  actualizar(): void {
    const nombrePromotora = this.busquedaPromotora.trim().toUpperCase();

    if (!this.cliente.nombre.trim() || !nombrePromotora) {
      this.alertaService.advertencia("Por favor complete todos los campos obligatorios (Nombre, Promotora).");
      return;
    }

    if (this.modoCrear) {
      if (!this.cliente.username.trim()) {
        this.alertaService.advertencia("El nombre de usuario es obligatorio.");
        return;
      }
      if (!this.cliente.password.trim() || this.cliente.password.length < 4) {
        this.alertaService.advertencia("La contraseña es requerida para un nuevo registro y debe tener al menos 4 caracteres.");
        return;
      }
    }

    // Comprobar si la promotora escrita ya existe
    const match = this.promotoras.find(p => p.promotora.toUpperCase() === nombrePromotora);
    if (match) {
      this.cliente.idPromotora = match.idPromotora;
      this.procederAGuardar();
    } else {
      // Registrar automáticamente la nueva promotora en la base de datos
      this.cargando = true;
      this.cdr.detectChanges();
      this.promotorasService.insertar({ promotora: nombrePromotora }).subscribe({
        next: (nuevaPromo) => {
          this.cliente.idPromotora = nuevaPromo.idPromotora;
          this.promotoras.push(nuevaPromo);
          this.procederAGuardar();
        },
        error: (err) => {
          this.cargando = false;
          this.cdr.detectChanges();
          this.alertaService.error("No se pudo crear la nueva promotora: " + (err.error || err.message));
        }
      });
    }
  }

  procederAGuardar(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    const dto = {
      username: this.cliente.username.trim(),
      password: this.cliente.password,
      nombre: this.cliente.nombre.trim(),
      rol: 'CLIENTE',
      telefono: this.cliente.telefono.trim(),
      correo: this.cliente.correo.trim(),
      activo: this.cliente.activo,
      idPromotora: this.cliente.idPromotora
    };

    const operacion = this.modoCrear
      ? this.clientesService.insertar(dto)
      : this.clientesService.actualizar(this.usuarioId, dto);

    operacion.subscribe({
      next: (res) => {
        this.cargando = false;
        this.cdr.detectChanges();
        if (res.succes) {
          this.alertaService.exito(this.modoCrear ? "Cliente creado con éxito." : "Cliente actualizado con éxito.");
          this.router.navigate(['/clientes']);
        } else {
          this.alertaService.error(res.mensaje || "Error al guardar el cliente.");
        }
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.alertaService.error("Error al guardar cliente: " + (err.error?.mensaje || err.error || err.message));
      }
    });
  }

  eliminar(): void {
    this.alertaService.confirmar(
      "¿Eliminar Cliente?", 
      `¿Está seguro de que desea eliminar permanentemente al cliente "${this.cliente.username}"?`,
      "Sí, eliminar"
    ).then((confirmado) => {
      if (confirmado) {
        this.cargando = true;
        this.clientesService.eliminar(this.usuarioId).subscribe({
          next: () => {
            this.cargando = false;
            this.alertaService.exito("Cliente eliminado con éxito.");
            this.router.navigate(['/clientes']);
          },
          error: (err) => {
            this.cargando = false;
            this.cdr.detectChanges();
            this.alertaService.error("Error al eliminar cliente: " + (err.error?.mensaje || err.error || err.message));
          }
        });
      }
    });
  }

  activarModoEdicion(): void {
    this.modoEdicion = true;
    this.puedeEditar = true;
    this.cdr.detectChanges();
  }

  toggleActivo(): void {
    const nuevoEstado = !this.cliente.activo;
    const msg = nuevoEstado ? "¿Activar cliente?" : "¿Desactivar cliente?";
    const confirmMsg = nuevoEstado ? "El cliente tendrá acceso al sistema." : "El cliente ya no podrá iniciar sesión.";
    
    this.alertaService.confirmar(msg, confirmMsg).then(confirmado => {
      if (confirmado) {
        this.cliente.activo = nuevoEstado;
        this.procederAGuardarSilencioso();
      }
    });
  }

  procederAGuardarSilencioso(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    const dto = {
      username: this.cliente.username.trim(),
      password: this.cliente.password,
      nombre: this.cliente.nombre.trim(),
      rol: 'CLIENTE',
      telefono: this.cliente.telefono.trim(),
      correo: this.cliente.correo.trim(),
      activo: this.cliente.activo,
      idPromotora: this.cliente.idPromotora
    };
    this.clientesService.actualizar(this.usuarioId, dto).subscribe({
      next: (res) => {
        this.cargando = false;
        this.cdr.detectChanges();
        if (res.succes) {
          this.alertaService.exito(this.cliente.activo ? "Cliente activado con éxito." : "Cliente desactivado con éxito.");
        } else {
          this.alertaService.error(res.mensaje || "Error al actualizar estado.");
          this.cliente.activo = !this.cliente.activo;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.cargando = false;
        this.cliente.activo = !this.cliente.activo;
        this.cdr.detectChanges();
        this.alertaService.error("Error al guardar: " + (err.error?.mensaje || err.error || err.message));
      }
    });
  }

  cancelar(): void {
    if (this.modoEdicion && !this.modoCrear) {
      this.modoEdicion = false;
      this.puedeEditar = false;
      this.cargarDatosCliente();
    } else {
      this.router.navigate(['/clientes']);
    }
  }
}
