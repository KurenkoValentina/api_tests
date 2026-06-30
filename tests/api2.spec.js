import { test } from '../src/helpers/fixtures/fixture';
import { expect } from '@playwright/test';
import { TodoBuilder } from '../src/helpers/builders/todo.builder';

//todo
//const urlApi = 'https://apichallenges.eviltester.com';
// Вспомогательная функция для создания сессии
async function createSession(api) {
  const headers = await api.challenger.post();
  const token = headers['x-challenger'];
  return token;
}
// Тест 1: Создание сессии

test('POST /challenger @POST', async ({ api }) => {
  let body, headers;
  headers = await api.challenger.post();
  expect(headers['x-challenger']).toBeDefined();
  expect(headers.location).toBeDefined();
});

// ({ body, headers } = await api.challenges.get(token));

// Тест 2: Получение списка челленджей
test('GET /challenges - получение списка челленджей @GET', async ({ api }) => {
  const token = await createSession(api);
  const { body } = await api.challenges.get(token);
  expect(body.challenges).toHaveLength(59);
});

// Тест 3: Создание todo POST /todos (200)
test('POST /todos - создание новой задачи @POST', async ({ api }) => {
  const token = await createSession(api);
  const todo = new TodoBuilder().addTitle().addDoneStatus(true).addDescription().build();

  const { body } = await api.todos.post(token, todo);

  expect(body.title).toEqual(todo.title);
  expect(body.doneStatus).toEqual(true);
  expect(body.description).toEqual(todo.description);
});

// Тест 4 получение всех задач GET /todos
test('GET /todos (200) - получение списка всех задач @GET', async ({ api }) => {
  const token = await createSession(api);
  const { body, status } = await api.todos.getAllTodos(token);

  expect(status).toBe(200);
  expect(body.todos.length).toBe(10);
});

// Тест 5  ошибка 404 в GET /todo(s)
test('GET /todos (404) - ошибка 404 - неверный путь @GET', async ({ api }) => {
  const token = await createSession(api);
  const { status } = await api.todos.getAllTodosWrongUrl(token);

  expect(status).toBe(404);
});

// тест 6 получаем задачу todo по id GET /todos/{id}
test('GET /todos/{id} (200) - получение задачи по id @GET', async ({ api }) => {
  const token = await createSession(api);
  // Создаём todo
  const todo = new TodoBuilder().addTitle(2).addDoneStatus(true).addDescription(2).build();
  const { body: created } = await api.todos.post(token, todo);
  const createdToDoId = created.id;
  const { body } = await api.todos.getTodoById(token, createdToDoId);

  const todoId = body.todos[0].id;
  expect(todoId).toBe(createdToDoId);
});
//тест 7 - фильтруем задачу по статусу true в списке todos GET /todos?filter (200)
test('GET /todos?filter (200) - получение задач по фильтру doneStatus=true   @GET', async ({
  api,
}) => {
  const token = await createSession(api);
  // Создаём выполненную задачу
  const doneTodo = new TodoBuilder().addTitle(2).addDoneStatus(true).addDescription(2).build();
  await api.todos.post(token, doneTodo);

  const { body } = await api.todos.getDoneTodos(token);
  const doneStatus = body.todos[0].doneStatus;
  expect(doneStatus).toBe(true);
});
// тест 8 обновить заголовок задачи по id POST /todos/{id} (200)
test('POST /todos/{id} - обновление задачи(заголовка) по id @POST', async ({ api }) => {
  const token = await createSession(api);

  // Создаём todo
  const todo = new TodoBuilder().addTitle(2).addDoneStatus(true).addDescription(3).build();
  const { body: created } = await api.todos.post(token, todo);
  const createdToDoId = created.id;
  //создаем новый заголовок
  const newTitle = new TodoBuilder().addTitle().build();

  const { body } = await api.todos.postById(token, newTitle, createdToDoId);
  expect(body.title).toEqual(newTitle.title);
  expect(body.doneStatus).toEqual(true);
  expect(body.description).toEqual(todo.description);
});

// тест 9 полное обновление задачи в списке PUT /todos/{id} (200)
test('PUT /todos/{id} - обновление задачи целиком по id @PUT', async ({ api }) => {
  const token = await createSession(api);
  // Создаём todo
  const todo = new TodoBuilder().addTitle(2).addDoneStatus(false).addDescription(3).build();
  const { body: created } = await api.todos.post(token, todo);
  const createdToDoId = created.id;

  const newToDo = new TodoBuilder().addTitle(3).addDoneStatus(true).addDescription(3).build();

  const { body } = await api.todos.putById(token, newToDo, createdToDoId);
  expect(body.title).toEqual(newToDo.title);
  expect(body.doneStatus).toEqual(true);
  expect(body.description).toEqual(newToDo.description);
});
//тест 10 удаление задачи DELETE /todos/{id} (200)
test('DELETE /todos/{id} - удаление задачи по id @DELETE', async ({ api }) => {
  const token = await createSession(api);
  // Создаём todo
  const todo = new TodoBuilder().addTitle(2).addDoneStatus(false).build();
  const { body: created } = await api.todos.post(token, todo);
  const createdToDoId = created.id;
  // проверка до удаления
  const { body: beforeDeleted } = await api.todos.getAllTodos(token);
  expect(beforeDeleted.todos.length).toBe(11);
  //удаляем
  const { status } = await api.todos.delete(token, createdToDoId);
  expect(status).toBe(200);
  //проверяем после удаления
  const { body: afterDeleted } = await api.todos.getAllTodos(token);
  expect(afterDeleted.todos.length).toBe(10);
});

// тест 11 -  Создание todo POST /todos c ошибкой - не boolean doneStatus  (400)
test('POST /todos - создание новой задачи c ошибкой 400 @POST', async ({ api }) => {
  const token = await createSession(api);
  const todo = new TodoBuilder().addTitle().addDoneStatus('status').addDescription().build();

  const { body, status } = await api.todos.post(token, todo);

  expect(body.errorMessages).toContain(
    'Failed Validation: doneStatus should be BOOLEAN but was STRING',
  );
  expect(status).toBe(400);
});
