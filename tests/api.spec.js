import { test } from '../src/helpers/fixtures/fixture';
import { expect } from '@playwright/test';
import { TodoBuilder } from '../src/helpers/builders/todo.builder';

test.describe('API Tests - единая сессия', () => {
  let token;
  let createdToDoId;

  // Гарантируем последовательное выполнение
  test.describe.configure({ mode: 'serial' });

  // Токен создаётся ОДИН раз перед всеми тестами
  test.beforeAll(async ({ api }) => {
    const headers = await api.challenger.post();
    token = headers['x-challenger'];
  });

  // Тест 1: Создание сессии
  test('POST /challenger - получение токена @POST', async () => {
    expect(token).toBeDefined();
  });

  // Тест 2: Получение списка челленджей
  test('GET /challenges - получение списка челленджей @GET', async ({ api }) => {
    const { body } = await api.challenges.get(token);
    expect(body.challenges).toHaveLength(59);
  });

  // Тест 3: Создание todo POST /todos (201)
  test('POST /todos - создание новой задачи (201) @POST', async ({ api }) => {
    const todo = new TodoBuilder().addTitle().addDoneStatus(true).addDescription().build();

    const { body } = await api.todos.post(token, todo);

    expect(body.title).toEqual(todo.title);
    expect(body.doneStatus).toEqual(true);
    expect(body.description).toEqual(todo.description);
  });

  // Тест 4 Получение всех задач GET /todos
  test('GET /todos (200) - получение списка всех задач @GET', async ({ api }) => {
    const { body, status } = await api.todos.getAllTodos(token);

    expect(status).toBe(200);
    expect(body.todos.length).toBe(11);
  });

  // Тест 5 ошибка 404 в GET /todo(s)
  test('GET /todos (404) - ошибка 404 - неверный путь @GET', async ({ api }) => {
    const { status } = await api.todos.getAllTodosWrongUrl(token);
    expect(status).toBe(404);
  });

  // тест 6 получаем задачу todo по id GET /todos/{id}
  test('GET /todos/{id} (200) - получение задачи по id @GET', async ({ api }) => {
    const todo = new TodoBuilder().addTitle(2).addDoneStatus(true).addDescription(2).build();
    const { body: created } = await api.todos.post(token, todo);
    createdToDoId = created.id; // сохраняем в общую переменную
    const { body } = await api.todos.getTodoById(token, createdToDoId);

    const todoId = body.todos[0].id;
    expect(todoId).toBe(createdToDoId);
  });

  // тест 7 - фильтруем задачу по статусу true
  test('GET /todos?filter (200) - получение задач по фильтру doneStatus=true @GET', async ({
    api,
  }) => {
    const doneTodo = new TodoBuilder().addTitle(2).addDoneStatus(true).addDescription(2).build();
    await api.todos.post(token, doneTodo);

    const { body } = await api.todos.getDoneTodos(token);
    const doneStatus = body.todos[0].doneStatus;
    expect(doneStatus).toBe(true);
  });

  // тест 8 обновить заголовок задачи по id POST /todos/{id} (200)
  test('POST /todos/{id} - обновление задачи(заголовка) по id @POST', async ({ api }) => {
    const todo = new TodoBuilder().addTitle(2).addDoneStatus(true).addDescription(3).build();
    const { body: created } = await api.todos.post(token, todo);
    createdToDoId = created.id; //  обновляем общую переменную

    const newTitle = new TodoBuilder().addTitle().build();

    const { body } = await api.todos.postById(token, newTitle, createdToDoId);
    expect(body.title).toEqual(newTitle.title);
    expect(body.doneStatus).toEqual(true);
    expect(body.description).toEqual(todo.description);
  });

  // тест 9 полное обновление задачи PUT /todos/{id} (200)
  test('PUT /todos/{id} - обновление задачи целиком по id @PUT', async ({ api }) => {
    const todo = new TodoBuilder().addTitle(2).addDoneStatus(false).addDescription(3).build();
    const { body: created } = await api.todos.post(token, todo);
    createdToDoId = created.id; //  обновляем общую переменную

    const newToDo = new TodoBuilder().addTitle(3).addDoneStatus(true).addDescription(3).build();

    const { body } = await api.todos.putById(token, newToDo, createdToDoId);
    expect(body.title).toEqual(newToDo.title);
    expect(body.doneStatus).toEqual(true);
    expect(body.description).toEqual(newToDo.description);
  });

  // тест 10 удаление задачи DELETE /todos/{id} (200)
  test('DELETE /todos/{id} - удаление задачи по id @DELETE', async ({ api }) => {
    const todo = new TodoBuilder().addTitle(2).addDoneStatus(false).build();
    const { body: created } = await api.todos.post(token, todo);
    createdToDoId = created.id; //  обновляем общую переменную

    // проверка до удаления
    const { body: beforeDeleted } = await api.todos.getAllTodos(token);
    const beforeCount = beforeDeleted.todos.length;

    // удаляем
    const { status } = await api.todos.delete(token, createdToDoId); // ← deleteById
    expect(status).toBe(200);

    // проверяем после удаления
    const { body: afterDeleted } = await api.todos.getAllTodos(token);
    expect(afterDeleted.todos.length).toBe(beforeCount - 1);
  });

  // тест 11 - POST /todos c ошибкой - не boolean doneStatus (400)
  test('POST /todos(400) - doneStatus should be BOOLEAN but was STRING @POST', async ({ api }) => {
    const todo = new TodoBuilder().addTitle().addDoneStatus('status').addDescription().build();

    const { body, status } = await api.todos.post(token, todo);

    expect(body.errorMessages).toContain(
      'Failed Validation: doneStatus should be BOOLEAN but was STRING',
    );
    expect(status).toBe(400);
  });

  // тест 12 - POST /todos c ошибкой - title too long (400)
  test('POST /todos(400) - Maximum allowable length for title is 50 @POST', async ({ api }) => {
    const todo = new TodoBuilder().addTitle(50).addDoneStatus(true).addDescription(2).build();

    const { body, status } = await api.todos.post(token, todo);

    expect(body.errorMessages).toContain(
      'Failed Validation: Maximum allowable length exceeded for title - maximum allowed is 50',
    );
    expect(status).toBe(400);
  });

  // тест 13 - POST /todos c ошибкой - description too long (400)
  test('POST /todos(400) - Maximum allowable length for description is 200 @POST', async ({
    api,
  }) => {
    const todo = new TodoBuilder().addTitle(2).addDoneStatus(true).addDescription(200).build();

    const { body, status } = await api.todos.post(token, todo);

    expect(body.errorMessages).toContain(
      'Failed Validation: Maximum allowable length exceeded for description - maximum allowed is 200',
    );
    expect(status).toBe(400);
  });

  // тест 14 - POST /todos c ошибкой - body too large (413)
  test('POST /todos (413) - Request body too large @POST', async ({ api }) => {
    const todo = new TodoBuilder()
      .addTitle(2)
      .addDoneStatus(true)
      .addDescriptionWithLength(5001)
      .build();

    const { body, status } = await api.todos.post(token, todo);

    expect(status).toBe(413);
    expect(body.errorMessages).toContain(
      'Error: Request body too large, max allowed is 5000 bytes',
    );
  });

  //тест 15 - POST /todos c ошибкой - unexpected field (400)
  test('POST /todos (400) - extra field @POST', async ({ api }) => {
    const todo = {
      title: 'a title',
      priority: 'extra',
    };

    const { body, status } = await api.todos.post(token, todo);

    expect(status).toBe(400);
    expect(body.errorMessages).toContain('Could not find field: priority');
  });

  // тест 16 - POST /todos/{id} - не найден id (404)
  test('POST /todos/{id} - 404, id does not exist @POST', async ({ api }) => {
    const newTitle = new TodoBuilder().addTitle().build();

    const { body, status } = await api.todos.postById(token, newTitle, 1000);
    expect(status).toBe(404);
    expect(body.errorMessages).toContain('No such todo entity instance with id == 1000 found');
  });

  //тест 17 - POST /todos XML (201)
  test('POST /todos XML - создание задачи в XML (201) @POST ', async ({ api }) => {
    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<todo>
  <title>XML задача</title>
  <doneStatus>true</doneStatus>
  <description>Это задача в XML формате</description>
</todo>`;

    const { body, status, headers } = await api.todos.postXml(token, xmlPayload);
    expect(status).toBe(201);
    expect(headers['content-type']).toContain('application/xml');
    expect(body).toContain('<title>XML задача</title>');
    expect(body).toContain('<doneStatus>true</doneStatus>');
  });

  // тест 18 - явная проверка POST /todos JSON (201)
  test('POST /todos - создание новой задачи в json (201) @POST', async ({ api }) => {
    const todo = new TodoBuilder().addTitle().addDoneStatus(true).addDescription().build();

    const { body, headers } = await api.todos.postJson(token, todo);
    expect(headers['content-type']).toContain('application/json');
    expect(body.title).toEqual(todo.title);
    expect(body.doneStatus).toEqual(true);
    expect(body.description).toEqual(todo.description);
  });

  //тест 19 - POST /todos неподдерживаемый формат данных (415)
  test('POST /todos (415) - Unsupported Media Type @POST', async ({ api }) => {
    const { body, status } = await api.todos.postPlainText(token, 'текст');

    expect(status).toBe(415);
    expect(body.errorMessages).toContain('Unsupported Content Type - text/plain');
  });
  // тест 20 - POST /todos  XML -> JSON
  test('POST /todos отправляем XML, принимаем JSON (201) @POST ', async ({ api }) => {
    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<todo>
  <title>XML задача</title>
  <doneStatus>true</doneStatus>
  <description>Это задача </description>
</todo>`;

    const { body, status, headers } = await api.todos.postXmlAcceptJson(token, xmlPayload);
    expect(status).toBe(201);
    expect(headers['content-type']).toContain('application/json');
    expect(body.title).toContain('задача');
    expect(body.description).toContain('Это задача');
    expect(body.doneStatus).toBe(true);
  });
  // тест 21 - POST /todos  JSON -> XML (201)
  test('POST /todos - отправляем JSON, принимаем XML (201) (201) @POST', async ({ api }) => {
    const todo = new TodoBuilder().addTitle().addDoneStatus(true).addDescription().build();

    const { body, headers } = await api.todos.postJsonAcceptXml(token, todo);
    expect(headers['content-type']).toContain('application/xml');
    expect(body).toContain('<todo>');
    expect(body).toContain(`<title>${todo.title}</title>`);
    expect(body).toContain('<doneStatus>true</doneStatus>');
    expect(body).toContain('<id>');
    expect(body).toContain(`<description>${todo.description}</description>`);
  });

  // тест 22 - GET /todos с Accept: application/xml (200)
  test('GET /todos (200) - получение задач в XML формате @GET', async ({ api }) => {
    const { body, status, headers } = await api.todos.getXml(token);

    expect(status).toBe(200);
    expect(headers['content-type']).toContain('application/xml');
    expect(body).toContain('<todos>');
    expect(body).toContain('<todo>');
    expect(body).toContain('</todo>');
    expect(body).toContain('</todos>');

    expect(body).toContain('<id>');
    expect(body).toContain('<title>');
    expect(body).toContain('<doneStatus>');
    expect(body).toContain('<description>');
  });
  // тест 23 - GET /todos с Accept: application/json (200)
  test('GET /todos (200) - получение задач в JSON формате @GET', async ({ api }) => {
    const { body, status, headers } = await api.todos.getJson(token);

    expect(status).toBe(200);
    expect(headers['content-type']).toContain('application/json');
    expect(body.todos[0].id).toBeDefined();
    expect(body.todos[0].title).toBeDefined();
    expect(body.todos[0].doneStatus).toBeDefined();
    expect(body.todos[0].description).toBeDefined();
  });

  // тест 24 - GET /todos с неподдерживаемым Accept (406)
  test('GET /todos (406) - с неподдерживаемым Accept @GET', async ({ api }) => {
    const { body, status, headers } = await api.todos.getWithUnsupportedAccept(token);

    expect(status).toBe(406);
    expect(body.errorMessages).toContain('Unrecognised Accept Type');
  });
  // тест 25 - PUT /todos/{id}(200) - с передачей в теле ответа не всех полей
  test('PUT /todos/{id} - обновление не целиком - дефолтные поля в ответе @PUT', async ({
    api,
  }) => {
    const todo = new TodoBuilder().addTitle(2).addDoneStatus(true).addDescription(3).build();
    const { body: created } = await api.todos.post(token, todo);
    createdToDoId = created.id; //  обновляем общую переменную

    const newToDo = new TodoBuilder().addTitle(3).build();

    const { body } = await api.todos.putById(token, newToDo, createdToDoId);
    expect(body.title).toEqual(newToDo.title);
    expect(body.doneStatus).toEqual(false);
    expect(body.description).toHaveLength(0);
    //удаляю задачу , потмоу что может не хватить места(лимит задач)
    await api.todos.delete(token, createdToDoId);
  });

  //тест 26 - PUT /todos/{id} (400) - попытка изменить id
  test('PUT /todos/{id} (400) - попытка изменить id @PUT', async ({ api }) => {
    const todo = new TodoBuilder().addTitle(2).addDoneStatus(true).addDescription(3).build();
    const { body: created } = await api.todos.post(token, todo);
    const createdId = created.id; //  обновляем общую переменную
    const differentId = createdId + 1;
    const newToDo = new TodoBuilder().addId(differentId).addTitle(2).addDescription(3).build();
    const { body, status } = await api.todos.putById(token, newToDo, createdId);
    expect(status).toEqual(400);
    expect(body.errorMessages).toContain(`Can not amend id from ${createdId} to ${newToDo.id}`);
  });
  //тест 27 - DELETE /heartbeat (405)
  test('DELETE /heartbeat - Method Not Allowed (405) @DELETE', async ({ api }) => {
    const { status } = await api.heartbeat.delete(token);
    expect(status).toBe(405);
  });
  //тест 28 - PATCH /heartbeat (500)
  test('PATCH /heartbeat - internal server error(500) @PATCH', async ({ api }) => {
    const { status } = await api.heartbeat.patch(token);
    expect(status).toBe(500);
  });

  //тест 29 - GET /heartbeat (204)
  test('GET /heartbeat - server is running(204) @GET', async ({ api }) => {
    const { status } = await api.heartbeat.get(token);
    expect(status).toBe(204);
  });
  //тест 30 - POST /heartbeat as DELETE(405)
  test('POST /heartbeat as DELETE - Method Not Allowed (405) @POST', async ({ api }) => {
    const { status } = await api.heartbeat.post(token);
    expect(status).toBe(405);
  });
  // тест 31 - удалить все задачи
  test('Удалить все задачи @DELETE', async ({ api }) => {
    // Получаем все задачи
    const { body } = await api.todos.getAllTodos(token);
    const ids = body.todos.map(({ id }) => id);

    // Удаляем каждую задачу
    for (const id of ids) {
      const { status } = await api.todos.delete(token, id);
      expect(status).toBe(200);
    }
    // Проверяем, что список пуст
    const { body: remainingTodos } = await api.todos.getAllTodos(token);
    expect(remainingTodos.todos).toHaveLength(0);
  });
});
