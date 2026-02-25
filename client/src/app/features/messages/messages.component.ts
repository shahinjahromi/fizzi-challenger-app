import { Component } from '@angular/core';

@Component({
  selector: 'app-messages',
  standalone: true,
  template: `
    <div class="space-y-4">
      <h2 class="text-2xl font-semibold text-gray-900">Messages</h2>
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <p class="text-sm text-gray-400">Inbox, threads, compose</p>
      </div>
    </div>
  `,
})
export class MessagesComponent {}
