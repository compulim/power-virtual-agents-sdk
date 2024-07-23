import { type Observer, Subscription } from 'iter-fest';

type Observation<T> = ['complete'] | ['error', unknown] | ['next', T] | ['start', Subscription];

/**
 * Mocks an observer and records all observations.
 */
export default class MockObserver<T> implements Required<Observer<T>> {
  constructor() {
    this.#complete = jest.fn<void, []>(() => this.#push(['complete']));
    this.#error = jest.fn(reason => this.#push(['error', reason]));
    this.#next = jest.fn(value => this.#push(['next', value]));
    this.#observe = jest.fn();
    this.#start = jest.fn(subscription => this.#push(['start', subscription]));
  }

  #complete: jest.Mock<void, []>;
  #error: jest.Mock<void, [unknown]>;
  #frozenObservations: ReadonlyArray<Observation<T>> | undefined;
  #next: jest.Mock<void, [T]>;
  #observe: jest.Mock<void, Observation<T>>;
  #observations: Array<Observation<T>> = [];
  #start: jest.Mock<void, [Subscription]>;

  #push(observation: Observation<T>): void {
    this.#observe(...observation);
    this.#observations.push(observation);
    this.#frozenObservations = undefined;
  }

  public get complete(): jest.Mock<void, []> {
    return this.#complete;
  }

  public get error(): jest.Mock<void, [unknown]> {
    return this.#error;
  }

  public get next(): jest.Mock<void, [T]> {
    return this.#next;
  }

  public get observe(): jest.Mock<void, Observation<T>> {
    return this.#observe;
  }

  public get start(): jest.Mock<void, [Subscription]> {
    return this.#start;
  }

  public get observations(): ReadonlyArray<Observation<T>> {
    if (!this.#frozenObservations) {
      this.#frozenObservations = Object.freeze([...this.#observations]);
    }

    return this.#frozenObservations;
  }
}
