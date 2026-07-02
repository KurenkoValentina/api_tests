import { test, expect } from '@playwright/test';

// todo
const urlApi = 'https://apichallenges.eviltester.com';

export class HeartbeatService {
  constructor(request) {
    this.request = request;
  }

  async delete(token) {
    return test.step('DELETE /heartbeat', async () => {
      const response = await this.request.delete(`${urlApi}/heartbeat`, {
        headers: { 'x-challenger': token },
      });
      const status = await response.status();
      return { status };
    });
  }

  async patch(token) {
    return test.step('PATCH /heartbeat', async () => {
      const response = await this.request.patch(`${urlApi}/heartbeat`, {
        headers: { 'x-challenger': token },
      });
      const status = await response.status();
      return { status };
    });
  }

  async get(token) {
    return test.step('GET /heartbeat', async () => {
      const response = await this.request.get(`${urlApi}/heartbeat`, {
        headers: { 'x-challenger': token },
      });
      const status = await response.status();
      return { status };
    });
  }
  async post(token) {
    return test.step('POST /heartbeat as DELETE', async () => {
      const response = await this.request.post(`${urlApi}/heartbeat`, {
        headers: {
          'x-challenger': token,
          'X-HTTP-Method-Override': 'DELETE',
        },
      });
      const status = await response.status();
      return { status };
    });
  }
}
