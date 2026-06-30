import { test, expect } from '@playwright/test';

// todo
const urlApi = 'https://apichallenges.eviltester.com';

export class TodosService {
  constructor(request) {
    this.request = request;
  }

  // Бизнес-сценарии для эндпоинта
  async post(token, todo) {
    return test.step('post /todos', async () => {
      let response = await this.request.post(`${urlApi}/todos`, {
        headers: {
          'x-challenger': token,
        },
        data: todo,
      });

      const headers = await response.headers();
      const body = await response.json();
      const status = await response.status();

      return { body, headers, status };
    });
  }

  async getAllTodos(token) {
    return test.step('get /todos', async () => {
      let response = await this.request.get(`${urlApi}/todos`, {
        headers: {
          'x-challenger': token,
        },
      });

      const headers = await response.headers();
      const body = await response.json();
      const status = await response.status();
      return { body, headers, status };
    });
  }

  async getAllTodosWrongUrl(token) {
    return test.step('get /todos', async () => {
      let response = await this.request.get(`${urlApi}/todo`, {
        headers: {
          'x-challenger': token,
        },
      });

      const status = await response.status();
      return { status };
    });
  }

  async getTodoById(token, id) {
    return test.step('get /todos/{id}', async () => {
      let response = await this.request.get(`${urlApi}/todos/${id}`, {
        headers: {
          'x-challenger': token,
        },
      });

      const headers = await response.headers();
      const body = await response.json();
      return { body, headers };
    });
  }

  async getDoneTodos(token) {
    return test.step('get /todos?doneStatus=true', async () => {
      let response = await this.request.get(`${urlApi}/todos?doneStatus=true`, {
        headers: {
          'x-challenger': token,
        },
      });
      const headers = await response.headers();
      const body = await response.json();
      return { body, headers };
    });
  }

  async postById(token, todo, id) {
    return test.step('post /todos/{id}', async () => {
      let response = await this.request.post(`${urlApi}/todos/${id}`, {
        headers: {
          'x-challenger': token,
        },
        data: todo,
      });
      const headers = await response.headers();
      const body = await response.json();
      return { body, headers };
    });
  }

  async putById(token, todo, id) {
    return test.step('put /todos/{id}', async () => {
      let response = await this.request.put(`${urlApi}/todos/${id}`, {
        headers: {
          'x-challenger': token,
        },
        data: todo,
      });

      const headers = await response.headers();
      const body = await response.json();

      return { body, headers };
    });
  }

  async delete(token, id) {
    return test.step('delete //todos/{id}', async () => {
      let response = await this.request.delete(`${urlApi}/todos/${id}`, {
        headers: {
          'x-challenger': token,
        },
      });
      const status = await response.status();
      return { status };
    });
  }
}
