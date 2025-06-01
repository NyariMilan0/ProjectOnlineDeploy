import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './_components/login/login.component';
import { StorageManagementComponent } from './_components/storage-management/storage-management.component';
import { authGuard } from './auth.guard';
import { NavbarComponent } from './_components/navbar/navbar.component';
import { ProfileComponent } from './_components/profile/profile.component';
import { NgModule } from '@angular/core';
import { ItemListComponent } from './_components/item-list/item-list.component';
import { AdminPanelComponent } from './_components/admin-panel/admin-panel.component';
import { PalletsComponent } from './_components/pallets/pallets.component';
import { TransferRequestsComponent } from './_components/transfer-requests/transfer-requests.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'storage', component: StorageManagementComponent, canActivate: [authGuard]},
  { path: 'pallets', component: PalletsComponent, canActivate: [authGuard]},
  { path: 'items', component: ItemListComponent, canActivate: [authGuard] },
  {path: 'navbar', component: NavbarComponent,canActivate: [authGuard]},
  {path: 'profileAdmin', component: ProfileComponent, canActivate: [authGuard]},
  {path: 'adminPanel', component: AdminPanelComponent, canActivate: [authGuard]},
  {path: 'transferRequest', component: TransferRequestsComponent, canActivate: [authGuard]},
  { path: '**', redirectTo: 'login' }
    
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
