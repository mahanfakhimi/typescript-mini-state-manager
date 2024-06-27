class Store<
  State extends Record<string, any>,
  Getters extends Record<string, (state: State) => void>,
  Mutations extends Record<string, (state: State, payload?: any) => void>
> {
  state: State;
  #initialState: State;
  getters: { [K in keyof Getters]: ReturnType<Getters[K]> };
  #mutations: Mutations;
  #watchers: ((state: State, getters: typeof this.getters) => void)[] = [];

  constructor(options: {
    state: State;
    getters?: Getters;
    mutations?: Mutations;
  }) {
    this.state = options.state;
    this.#initialState = JSON.parse(JSON.stringify(this.state));
    this.#mutations = options.mutations! || {};

    this.getters = new Proxy(options.getters! || {}, {
      get: (target, prop: string) => {
        if (prop in target) {
          const getter = target[prop as keyof Getters];
          if (typeof getter === "function") return getter(this.state);
        }

        return undefined;
      },
    }) as typeof this.getters;
  }

  commit<K extends keyof Mutations>(
    mutationName: K,
    payload?: Parameters<Mutations[K]>[1]
  ) {
    const mutation = this.#mutations[mutationName];

    if (typeof mutation === "function") {
      this.#mutations[mutationName](this.state, payload);
      this.#runWatchers();
    } else throw new Error(`mutation ${mutationName.toString()} not found`);
  }

  #runWatchers() {
    this.#watchers.forEach((watcher) => watcher(this.state, this.getters));
  }

  watch(callback: (state: State, getters: typeof this.getters) => void) {
    callback(this.state, this.getters);
    this.#watchers.push(callback);
  }

  reset() {
    this.state = JSON.parse(JSON.stringify(this.#initialState));
    this.#runWatchers();
  }
}

const createStore = <
  State extends Record<string, any>,
  Getters extends Record<string, (state: State) => void>,
  Mutations extends Record<string, (state: State, payload?: any) => void>
>(options: {
  state: State;
  getters: Getters;
  mutations: Mutations;
}) => new Store(options);

const store = createStore({
  state: { count: { value: 0 } },

  getters: {
    getCount: (state) => {
      return state.count.value;
    },
  },

  mutations: {
    incrementCount: (state, payload: number) => {
      return (state.count.value += payload);
    },

    decrementCount: (state, payload: number) => {
      return (state.count.value -= payload);
    },
  },
});

const incrementBtn = document.querySelectorAll("button")[0];
const decrementBtn = document.querySelectorAll("button")[1];
const resetBtn = document.querySelectorAll("button")[2];
const h1 = document.querySelector("h1");

const COUNT_CHANGE_VALUE = 2 as const;

store.watch((state, getters) => {
  h1!.innerText = getters.getCount.toString();
});

incrementBtn.addEventListener("click", () => {
  store.commit("incrementCount", COUNT_CHANGE_VALUE);
});

decrementBtn.addEventListener("click", () => {
  store.commit("decrementCount", COUNT_CHANGE_VALUE);
});

resetBtn.addEventListener("click", () => {
  store.reset();
});
