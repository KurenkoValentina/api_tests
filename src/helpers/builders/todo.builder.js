import { faker } from '@faker-js/faker';

export class TodoBuilder {
  addId(number) {
    this.id = number;
    return this;
  }
  addTitle(wordsCount) {
    this.title = faker.lorem.words(wordsCount) ?? faker.lorem.word();
    return this;
  }

  addDescription(wordsCount) {
    this.description = faker.lorem.words(wordsCount) ?? faker.lorem.word();
    return this;
  }
  //  Для теста на 413 — строка заданной длины
  addDescriptionWithLength(length) {
    this.description = 'a'.repeat(length);
    return this;
  }

  addDoneStatus(status) {
    this.doneStatus = status;
    return this;
  }

  build() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      doneStatus: this.doneStatus,
    };
  }
}
