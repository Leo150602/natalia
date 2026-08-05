import { Routes } from '@angular/router';
import { Home } from './paginas/home/home';
import { IncidenciasComponent } from './paginas/incidencias/incidencias';
import { VisitasComponent } from './paginas/visitas/visitas';
import { PromocionesComponent } from './paginas/promociones/promociones';
import { PersonasComponent } from './paginas/personas/personas';
import { PisosComponent } from './paginas/pisos/pisos';
import { ImportarIncidenciasComponent } from './paginas/importar-incidencias/importar-incidencias';
import { ImportarPisosComponent } from './paginas/importar-pisos/importar-pisos';
import { ImportarVisitasComponent } from './paginas/importar-visitas/importar-visitas';
import { ImportarPromocionesComponent } from './paginas/importar-promociones/importar-promociones';
import { ImportarPersonasComponent } from './paginas/importar-personas/importar-personas';
import { LoginComponent } from './paginas/login/login';
import { UsuariosComponent } from './paginas/usuarios/usuarios';
import { RegistroUsuariosComponent } from './paginas/registro-usuarios/registro-usuarios';
import { SolicitudesComponent } from './paginas/solicitudes/solicitudes';
import { ClientesComponent } from './paginas/clientes/clientes';
import { ImportarClientesComponent } from './paginas/importar-clientes/importar-clientes';
import { authGuard } from './servicios/auth-guard';

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
        path: 'incidencias',
        component: IncidenciasComponent,
        canActivate: [authGuard]
    },
    {
        path: 'visitas',
        component: VisitasComponent,
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
        path: 'personas',
        component: PersonasComponent,
        canActivate: [authGuard]
    },
    {
        path: 'pisos',
        component: PisosComponent,
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
        path: 'registro-usuarios',
        component: RegistroUsuariosComponent,
        canActivate: [authGuard]
    }
];
