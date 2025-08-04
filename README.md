## 과제 체크포인트

### 기본과제

- [x] shallowEquals 구현 완료
- [x] deepEquals 구현 완료
- [x] memo 구현 완료
- [x] deepMemo 구현 완료
- [x] useRef 구현 완료
- [x] useMemo 구현 완료
- [x] useDeepMemo 구현 완료
- [x] useCallback 구현 완료

### 심화 과제

- [x] 기본과제에서 작성한 hook을 이용하여 렌더링 최적화를 진행하였다.
- [x] Context 코드를 개선하여 렌더링을 최소화하였다.

## 과제 셀프회고

<!-- 과제에 대한 회고를 작성해주세요 -->

### 기술적 성장
<!-- 예시
- 새로 학습한 개념
- 기존 지식의 재발견/심화
- 구현 과정에서의 기술적 도전과 해결
-->

1. useRef

```typescript
export function useRef<T>(initialValue: T): { current: T } {
  const [ref] = useState(() => ({ current: initialValue }));
  return ref;
}
```

- useState 는 값을 변경시 리렌더링을 발생시키지만 useRef는 그렇지 않다.
> useState 가 값을 변경하는 겻을 `Object.is` 를 활용해 비교하는 점을 활용하여 useRef를 구현하였습니다.

2. useMemo

```typescript
export function useMemo<T>(
  factory: () => T,
  _deps: DependencyList,
  _equals = shallowEquals,
): T {
  const valueRef = useRef<T | null>(null);
  const depsRef = useRef(_deps);

  if (valueRef.current === null || !_equals(depsRef.current, _deps)) {
    valueRef.current = factory();
    depsRef.current = _deps;
  }

  return valueRef.current;
}
```

- useMemo는 계산 비용이 높은 값을 메모이제이션하여 불필요한 재계산을 방지합니다.
> 의존성 배열이 변경될 때에만 재계산된 값과 새로운 의존성 배열을 저장하고 재계산된 값을 리턴해서 구현하였습니다.

3. useCallback

```typescript
export function useCallback<T extends Function>(
  factory: T,
  _deps: DependencyList,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useMemo(() => factory, _deps);
  return memoizedCallback;
}
```

- useCallback은 함수를 메모이제이션하여 불필요한 리렌더링을 방지합니다.
> useMemo에서 값이 아닌 함수를 저장하도록 변경하여 구현하였습니다.

4. memo

```typescript
export function memo<P extends object>(
  Component: ComponentType<P>,
  _equals = shallowEquals,
) {
  let memoizedComponent: ReactNode | null = null;
  let memoizedProps: P | null = null;
  return (props: P) => {
    if (!_equals(memoizedProps, props)) {
      memoizedProps = props;
      memoizedComponent = React.createElement(Component, props);
    }
    return memoizedComponent;
  };
}
```

- React.memo는 컴포넌트의 불필요한 리렌더링을 방지하는 고차 컴포넌트(HOC)입니다.
> Component 값과 props 값을 저장 해두고 props의 값이 변경되었을 때에만 새로운 컴포넌트를 생성하고 이를 저장하고 리턴

- 새로 학습한 개념

1. useSyncExternalStore
- 외부 상태 관리 시스템과 React 를 동기화 하는 훅

```typescript
useSyncExternalStore(
  subscribe,  // 외부 스토어 구독 함수
  getSnapshot, // 현재 상태 가져오는 함수
  getServerSnapshot // SSR용 초기 상태 (선택)
);
```

2. useStore

```typescript
export const useStore = <T, S>(store: Store<T>, selector: (store: T) => S) => {
  const prevRef = useRef<S | null>(null);

  return useSyncExternalStore(store.subscribe, () => {
    const next = selector(store.getState());
    if (prevRef.current === null || !shallowEquals(prevRef.current!, next)) {
      prevRef.current = next;
    }
    return prevRef.current;
  });
};
```

> selector 함수를 인자로 받아 selector 를 통해 반환되고 있는 값을 사용하는 컴포넌트만 리렌더링 되도록 구현하였습니다.

- 구현 과정에서의 기술적 도전과 해결

1. app ( 기존 테스트 코드를 통과하는 구현 )
- 각 context 들을 관심사별로 분리하고 각각 Provider 를 두어 최적화 

```typescript
const App = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <UserProvider>
          <MainSection />
        </UserProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};
```

2. app-enhanced ( context 의 state 와 action을 분리하여 구현 )
- 이전에 분리된 context 에서 state와 action을 따로 분리하여 상태가 변경되어도 action 만을 가지고 있는 컴포넌트들은 리렌더링 방지

```typescript
const App = () => {
  return (
    <ThemeActionContext.Provider value={themeAction}>
      <ThemeStateContext.Provider value={themeState}>
        <NotificationActionContext.Provider value={notificationAction}>
          <NotificationStateContext.Provider value={notificationState}>
            <UserActionContext.Provider value={userAction}>
              <UserStateContext.Provider value={userState}>
                <MainSection />
              </UserStateContext.Provider>
            </UserActionContext.Provider>
          </NotificationStateContext.Provider>
        </NotificationActionContext.Provider>
      </ThemeStateContext.Provider>
    </ThemeActionContext.Provider>
  );
};
```

4. app-plus ( 외부 store 와 selector를 통한 최적화를 구현 )
- zustand 의 useRef, useStore, context api 를 활용하여 상태관리를 하는 방식을 구현으로 옮겨보았습니다.

```typescript
// createStore 

type SetState<T> = (newState: T | ((state: T) => T)) => void;
type GetState<T> = () => T;
type CreateState<T> = (set: SetState<T>, get: GetState<T>) => T;

export type Store<T> = ReturnType<typeof createStore<T>>;

export const createStore = <T>(createState: CreateState<T>) => {
  let state: T;
  const listeners = new Set<() => void>();
  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (newState) => {
    const nextState =
      typeof newState === "function"
        ? (newState as (state: T) => T)(state)
        : newState;

    if (!shallowEquals(nextState, state)) {
      state = nextState;
      listeners.forEach((listener) => listener());
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  state = createState(setState, getState);

  return {
    subscribe,
    getState,
    setState,
  };
};

// useStore

export const useStore = <T, S>(store: Store<T>, selector: (store: T) => S) => {
  const prevRef = useRef<S | null>(null);

  return useSyncExternalStore(store.subscribe, () => {
    const next = selector(store.getState());
    if (prevRef.current === null || !shallowEquals(prevRef.current!, next)) {
      prevRef.current = next;
    }
    return prevRef.current;
  });
};

// NotificationContext

interface NotificationState {
  notifications: Notification[];
}

interface NotificationAction {
  addNotification: (message: string, type: Notification["type"]) => void;
  removeNotification: (id: number) => void;
}

export type NotificationType = NotificationState & NotificationAction;
export type NotificationStore = Store<NotificationType>;

export const notificationStore: NotificationStore =
  createStore<NotificationType>((set) => ({
    notifications: [],
    addNotification: (message, type) => {
      const newNotification: Notification = {
        id: Date.now(),
        message,
        type,
      };

      set((prev) => ({
        ...prev,
        notifications: [...prev.notifications, newNotification],
      }));
    },
    removeNotification: (id) => {
      set((prev) => ({
        ...prev,
        notifications: prev.notifications.filter(
          (notification) => notification.id !== id,
        ),
      }));
    },
  }));

export const NotificationContext = createContext<NotificationStore | undefined>(
  undefined,
);

// NotificationProvider

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const store = useRef<NotificationStore | null>(null);

  if (store.current === null) {
    store.current = notificationStore;
  }

  return (
    <NotificationContext.Provider value={store.current}>
      {children}
    </NotificationContext.Provider>
  );
};

// useNotification

export const useNotificationStore = <S>(
  selector: (store: NotificationType) => S,
) => {
  const store = useContext(NotificationContext);
  if (store === undefined) {
    throw new Error(
      "useNotificationContext must be used within an NotificationProvider",
    );
  }
  return useStore(store, selector);
};

```
