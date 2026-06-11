export interface RegisterDriverPayload {
  name: string;
  phoneNumber: string;
}

/**
 * A mock API client that simulates adding tenant headers
 * and sending a payload to a backend server.
 */
export async function registerTestDriver(
  tenantId: string,
  payload: RegisterDriverPayload
): Promise<{ success: boolean; message: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Construct the headers as they would be sent to the backend
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId, // Multi-tenant context header
  };

  // Log exactly what would be sent over the wire
  console.group(`🚀 API Request: POST /api/v1/drivers/register`);
  console.log('Headers:', headers);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.groupEnd();

  return { success: true, message: 'Driver registered successfully' };
}
