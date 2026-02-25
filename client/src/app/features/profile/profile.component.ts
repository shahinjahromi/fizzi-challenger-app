import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, Profile, UpdateProfilePayload } from '../../core/api/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <h2 class="text-2xl font-semibold text-gray-900">Profile</h2>

      @if (loadError) {
        <p class="text-sm text-red-600">{{ loadError }}</p>
      }

      @if (profile) {
        <!-- Account details -->
        <section class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Account details</h3>
          <form (ngSubmit)="saveProfile()" class="space-y-4 max-w-xl">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  [(ngModel)]="profile.username"
                  name="username"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  [value]="profile.email"
                  disabled
                  class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
                <p class="text-xs text-gray-400 mt-0.5">Email cannot be changed here.</p>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input
                  [(ngModel)]="profile.firstName"
                  name="firstName"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input
                  [(ngModel)]="profile.lastName"
                  name="lastName"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            @if (profileSuccess) {
              <p class="text-sm text-green-600">{{ profileSuccess }}</p>
            }
            @if (profileError) {
              <p class="text-sm text-red-600">{{ profileError }}</p>
            }
            <button
              type="submit"
              [disabled]="profileSaving"
              class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ profileSaving ? 'Saving…' : 'Save changes' }}
            </button>
          </form>
        </section>

        <!-- Business address -->
        <section class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Business address</h3>
          <form (ngSubmit)="saveProfile()" class="space-y-4 max-w-xl">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Address line 1</label>
              <input
                [(ngModel)]="profile.businessAddressLine1"
                name="businessAddressLine1"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Address line 2</label>
              <input
                [(ngModel)]="profile.businessAddressLine2"
                name="businessAddressLine2"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  [(ngModel)]="profile.businessCity"
                  name="businessCity"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                <input
                  [(ngModel)]="profile.businessState"
                  name="businessState"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Postal code</label>
                <input
                  [(ngModel)]="profile.businessPostalCode"
                  name="businessPostalCode"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                [(ngModel)]="profile.businessCountry"
                name="businessCountry"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              [disabled]="profileSaving"
              class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ profileSaving ? 'Saving…' : 'Save address' }}
            </button>
          </form>
        </section>

        <!-- Change password -->
        <section class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Change password</h3>
          <form (ngSubmit)="changePasswordSubmit()" class="space-y-4 max-w-xl">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                [(ngModel)]="password.current"
                name="currentPassword"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                [(ngModel)]="password.new"
                name="newPassword"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                minlength="8"
                required
              />
              <p class="text-xs text-gray-400 mt-0.5">At least 8 characters.</p>
            </div>
            @if (passwordSuccess) {
              <p class="text-sm text-green-600">{{ passwordSuccess }}</p>
            }
            @if (passwordError) {
              <p class="text-sm text-red-600">{{ passwordError }}</p>
            }
            <button
              type="submit"
              [disabled]="passwordSaving"
              class="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50"
            >
              {{ passwordSaving ? 'Updating…' : 'Update password' }}
            </button>
          </form>
        </section>
      }
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private profileApi = inject(ProfileService);

  profile: Profile | null = null;
  loadError: string | null = null;
  profileSaving = false;
  profileSuccess: string | null = null;
  profileError: string | null = null;

  password = { current: '', new: '' };
  passwordSaving = false;
  passwordSuccess: string | null = null;
  passwordError: string | null = null;

  ngOnInit(): void {
    this.profileApi.getProfile().subscribe({
      next: (p) => (this.profile = p),
      error: (err) => (this.loadError = err?.error?.message ?? 'Failed to load profile.'),
    });
  }

  saveProfile(): void {
    if (!this.profile) return;
    this.profileError = null;
    this.profileSuccess = null;
    this.profileSaving = true;
    const payload: UpdateProfilePayload = {
      username: this.profile.username,
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      businessAddressLine1: this.profile.businessAddressLine1 ?? null,
      businessAddressLine2: this.profile.businessAddressLine2 ?? null,
      businessCity: this.profile.businessCity ?? null,
      businessState: this.profile.businessState ?? null,
      businessPostalCode: this.profile.businessPostalCode ?? null,
      businessCountry: this.profile.businessCountry ?? null,
    };
    this.profileApi.updateProfile(payload).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.profileSuccess = 'Profile saved.';
        this.profileSaving = false;
      },
      error: (err) => {
        this.profileError = err?.error?.message ?? 'Failed to save.';
        this.profileSaving = false;
      },
    });
  }

  changePasswordSubmit(): void {
    this.passwordError = null;
    this.passwordSuccess = null;
    if (!this.password.new || this.password.new.length < 8) {
      this.passwordError = 'New password must be at least 8 characters.';
      return;
    }
    this.passwordSaving = true;
    this.profileApi.changePassword(this.password.current, this.password.new).subscribe({
      next: () => {
        this.password = { current: '', new: '' };
        this.passwordSuccess = 'Password updated.';
        this.passwordSaving = false;
      },
      error: (err) => {
        this.passwordError = err?.error?.message ?? 'Failed to update password.';
        this.passwordSaving = false;
      },
    });
  }
}
