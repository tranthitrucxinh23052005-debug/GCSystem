// src/api/base44Client.js
import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '', // Để trống để SDK dùng relative path
  requiresAuth: false,
  appBaseUrl: '' // Để trống để SDK tự hiểu là đi từ domain hiện tại (Vercel) sau đó vercel.json sẽ proxy đi
});