import { test, expect } from '@playwright/test';

// todo
const urlApi = 'https://apichallenges.eviltester.com';

export class ChallengesService {
  constructor(request) {
    this.request = request;
  }

  // Бизнес-сценарии для эндпоинта
  async get(token) {
    return test.step('get /challenges', async () => {
      let response = await this.request.get(`${urlApi}/challenges`, {
        headers: {
          'x-challenger': token,
        },
      });

      const headers = await response.headers();
      const body = await response.json();

      return { body, headers };
    });
  }
}
