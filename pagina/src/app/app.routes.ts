import { Routes } from '@angular/router';
import { Home } from './paginas/home/home';
import { IncidenciasComponent } from './paginas/incidencias/incidencias';
import { DetalleIncidenciaComponent } from './paginas/incidencias/detalle/detalle';
import { VisitasComponent } from './paginas/visitas/visitas';
import { DetalleVisitaComponent } from './paginas/visitas/detalle/detalle';
import { VisitasCalendarioComponent } from './paginas/visitas/calendario/calendario';
import { VisitasDiaComponent } from './paginas/visitas/dia/dia';
import { PromocionesComponent } from './paginas/promociones/promociones';
import { DetallePromocionComponent } from './paginas/promociones/detalle/detalle';
import { PersonasComponent } from './paginas/personas/personas';
import { DetallePersonaComponent } from './paginas/personas/detalle/detalle';
import { PisosComponent } from './paginas/pisos/pisos';
import { DetallePisoComponent } from './paginas/pisos/detalle/detalle';
import { ImportarIncidenciasComponent } from './paginas/importar-incidencias/importar-incidencias';
import { ImportarPisosComponent } from './paginas/importar-pisos/importar-pisos';
import { ImportarVisitasComponent } from './paginas/importar-visitas/importar-visitas';
import { ImportarPromocionesComponent } from './paginas/importar-promociones/importar-promociones';
import { ImportarPersonasComponent } from './paginas/importar-personas/importar-personas';
import { LoginComponent } from './paginas/login/login';
import { UsuariosComponent } from './paginas/usuarios/usuarios';
import { DetalleUsuarioComponent } from './paginas/usuarios/detalle/detalle';
import { SolicitudesComponent } from './paginas/solicitudes/solicitudes';
import { ClientesComponent } from './paginas/clientes/clientes';
import { DetalleClienteComponent } from './paginas/clientes/detalle/detalle';
import { ImportarClientesComponent } from './paginas/importar-clientes/importar-clientes';
import { authGuard } from './servicios/auth-guard';
import { PlantillasComponent } from './paginas/plantillas/plantillas';
import { DetallePlantillaComponent } from './paginas/plantillas/detalle/detalle';
import { MapaClientesComponent } from './paginas/mapa-clientes/mapa-clientes';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: '',
        component: Home,
        canActivate: [authGuard]
    },
    {
        path: 'mapa-clientes',
        component: MapaClientesComponent,
        canActivate: [authGuard]
    },
    {
        path: 'incidencias',
        component: IncidenciasComponent,
        canActivate: [authGuard]
    },
    {
        path: 'incidencias/detalle/:id',
        component: DetalleIncidenciaComponent,
        canActivate: [authGuard]
    },
    {
        path: 'visitas',
        component: VisitasComponent,
        canActivate: [authGuard]
    },
    {
        path: 'visitas/detalle/:id',
        component: DetalleVisitaComponent,
        canActivate: [authGuard]
    },
    {
        path: 'visitas/calendario',
        component: VisitasCalendarioComponent,
        canActivate: [authGuard]
    },
    {
        path: 'visitas/dia/:fecha',
        component: VisitasDiaComponent,
        canActivate: [authGuard]
    },
    {
        path: 'solicitudes',
        component: SolicitudesComponent,
        canActivate: [authGuard]
    },
    {
        path: 'clientes',
        component: ClientesComponent,
        canActivate: [authGuard]
    },
    {
        path: 'clientes/detalle/:id',
        component: DetalleClienteComponent,
        canActivate: [authGuard]
    },
    {
        path: 'importar-clientes',
        component: ImportarClientesComponent,
        canActivate: [authGuard]
    },
    {
        path: 'promociones',
        component: PromocionesComponent,
        canActivate: [authGuard]
    },
    {
        path: 'promociones/detalle/:id',
        component: DetallePromocionComponent,
        canActivate: [authGuard]
    },
    {
        path: 'personas',
        component: PersonasComponent,
        canActivate: [authGuard]
    },
    {
        path: 'personas/detalle/:id',
        component: DetallePersonaComponent,
        canActivate: [authGuard]
    },
    {
        path: 'pisos',
        component: PisosComponent,
        canActivate: [authGuard]
    },
    {
        path: 'pisos/detalle/:id',
        component: DetallePisoComponent,
        canActivate: [authGuard]
    },
    {
        path: 'importar-incidencias',
        component: ImportarIncidenciasComponent,
        canActivate: [authGuard]
    },
    {
        path: 'importar-pisos',
        component: ImportarPisosComponent,
        canActivate: [authGuard]
    },
    {
        path: 'importar-visitas',
        component: ImportarVisitasComponent,
        canActivate: [authGuard]
    },
    {
        path: 'importar-promociones',
        component: ImportarPromocionesComponent,
        canActivate: [authGuard]
    },
    {
        path: 'importar-personas',
        component: ImportarPersonasComponent,
        canActivate: [authGuard]
    },
    {
        path: 'usuarios',
        component: UsuariosComponent,
        canActivate: [authGuard]
    },
    {
        path: 'usuarios/detalle/:id',
        component: DetalleUsuarioComponent,
        canActivate: [authGuard]
    },
    {
        path: 'plantillas',
        component: PlantillasComponent,
        canActivate: [authGuard]
    },
    {
        path: 'plantillas/detalle/:id',
        component: DetallePlantillaComponent,
        canActivate: [authGuard]
    },
    {
        path: 'documentos/detalle/:id',
        component: DetallePlantillaComponent,
        canActivate: [authGuard]
    }
];
