import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService, User } from '../services/users.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  standalone: false
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  showCreateForm = false;
  createForm: FormGroup;
  hidePassword = true;
  displayedColumns = ['username', 'role', 'active', 'lastLogin', 'actions'];

  constructor(
    private usersService: UsersService,
    private notification: NotificationService,
    private fb: FormBuilder,
  ) {
    this.createForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['personal', Validators.required],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.usersService.getUsers().subscribe({
      next: r => { this.users = r.data; this.isLoading = false; },
      error: () => this.isLoading = false,
    });
  }

  create(): void {
    if (this.createForm.invalid) return;
    this.usersService.createUser(this.createForm.value).subscribe({
      next: () => {
        this.notification.info('Benutzer angelegt');
        this.createForm.reset({ role: 'personal' });
        this.showCreateForm = false;
        this.load();
      },
      error: (e) => this.notification.error(e.error?.message || 'Fehler beim Anlegen'),
    });
  }

  toggleActive(user: User): void {
    this.usersService.updateUser(user._id!, { active: !user.active }).subscribe({
      next: () => { user.active = !user.active; },
      error: () => this.notification.error('Fehler beim Aktualisieren'),
    });
  }

  changeRole(user: User, role: 'manager' | 'personal'): void {
    this.usersService.updateUser(user._id!, { role }).subscribe({
      next: () => { user.role = role; this.notification.info('Rolle geändert'); },
      error: () => this.notification.error('Fehler beim Ändern'),
    });
  }

  delete(user: User): void {
    if (!confirm(`Benutzer "${user.username}" wirklich löschen?`)) return;
    this.usersService.deleteUser(user._id!).subscribe({
      next: () => { this.users = this.users.filter(u => u._id !== user._id); },
      error: () => this.notification.error('Fehler beim Löschen'),
    });
  }
}
