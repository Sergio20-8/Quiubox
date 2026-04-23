import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import type { User } from '../../core/models/domain.models';
import { NotificationService } from '../../core/services/notification.service';
import { UsersApiService } from '../../core/services/users-api.service';
import { UserCreateDialogComponent } from './user-create-dialog.component';

@Component({
  selector: 'app-users-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTableModule,
  ],
  templateUrl: './users-admin-page.component.html',
  styleUrl: './users-admin-page.component.scss',
})
export class UsersAdminPageComponent {
  private readonly dialog = inject(MatDialog);
  private readonly usersApi = inject(UsersApiService);
  private readonly notifications = inject(NotificationService);

  users: User[] = [];
  readonly displayedColumns = ['username', 'nombres', 'apellidos', 'email', 'role', 'actions'];

  constructor() {
    this.reload();
  }

  reload(): void {
    this.usersApi.listUsers().subscribe((list) => {
      this.users = list;
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(UserCreateDialogComponent, {
      autoFocus: false,
      panelClass: 'qb-dialog-panel',
      data: { mode: 'create' },
    });

    ref.afterClosed().subscribe((created) => {
      if (!created) {
        return;
      }
      this.notifications.success('Usuario creado');
      this.reload();
    });
  }

  openViewDialog(user: User): void {
    this.dialog.open(UserCreateDialogComponent, {
      autoFocus: false,
      panelClass: 'qb-dialog-panel',
      data: { mode: 'view', user },
    });
  }

  openEditDialog(user: User): void {
    const ref = this.dialog.open(UserCreateDialogComponent, {
      autoFocus: false,
      panelClass: 'qb-dialog-panel',
      data: { mode: 'edit', user },
    });

    ref.afterClosed().subscribe((updated) => {
      if (!updated) {
        return;
      }
      this.notifications.success('Usuario actualizado');
      this.reload();
    });
  }

  remove(user: User): void {
    if (!confirm(`¿Eliminar a ${user.username}?`)) {
      return;
    }
    this.usersApi.deleteUser(user.id).subscribe(() => {
      this.notifications.success('Usuario eliminado');
      this.reload();
    });
  }

  roleLabel(user: User): string {
    return user.role === 'admin' ? 'Administrador' : 'Usuario';
  }
}
