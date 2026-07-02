import { ChallengerService, ChallengesService, TodosService, HeartbeatService } from './index';
//Фасад
export class Api {
  constructor(request) {
    this.request = request;
    this.challenger = new ChallengerService(request);
    this.challenges = new ChallengesService(request);
    this.todos = new TodosService(request);
    this.heartbeat = new HeartbeatService(request);
  }
}
