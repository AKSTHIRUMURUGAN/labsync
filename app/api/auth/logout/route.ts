import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  const response = successResponse({ message: 'Logged out successfully' });
  
  response.cookies.delete('auth_token');
  
  return response;
}
