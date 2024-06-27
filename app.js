"use strict";
class Store {
    state;
    #initialState;
    getters;
    #mutations;
    #watchers = [];
    constructor(options) {
        this.state = options.state;
        this.#initialState = JSON.parse(JSON.stringify(this.state));
        this.#mutations = options.mutations || {};
        this.getters = new Proxy(options.getters || {}, {
            get: (target, prop) => {
                if (prop in target) {
                    const getter = target[prop];
                    if (typeof getter === "function")
                        return getter(this.state);
                }
                return undefined;
            },
        });
    }
    commit(mutationName, payload) {
        const mutation = this.#mutations[mutationName];
        if (typeof mutation === "function") {
            this.#mutations[mutationName](this.state, payload);
            this.#runWatchers();
        }
        else
            throw new Error(`mutation ${mutationName.toString()} not found`);
    }
    #runWatchers() {
        this.#watchers.forEach((watcher) => watcher(this.state, this.getters));
    }
    watch(callback) {
        callback(this.state, this.getters);
        this.#watchers.push(callback);
    }
    reset() {
        this.state = JSON.parse(JSON.stringify(this.#initialState));
        this.#runWatchers();
    }
}
const createStore = (options) => new Store(options);
const store = createStore({
    state: { count: { value: 0 } },
    getters: {
        getCount: (state) => {
            return state.count.value;
        },
    },
    mutations: {
        incrementCount: (state, payload) => {
            return (state.count.value += payload);
        },
        decrementCount: (state, payload) => {
            return (state.count.value -= payload);
        },
    },
});
const incrementBtn = document.querySelectorAll("button")[0];
const decrementBtn = document.querySelectorAll("button")[1];
const resetBtn = document.querySelectorAll("button")[2];
const h1 = document.querySelector("h1");
const COUNT_CHANGE_VALUE = 2;
store.watch((state, getters) => {
    h1.innerText = getters.getCount.toString();
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
