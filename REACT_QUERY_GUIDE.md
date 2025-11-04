# React Query Integration Guide - Rielvestor Platform

## 🎯 Что такое React Query?

**React Query** (TanStack Query) - библиотека для управления серверным состоянием в React приложениях.

### Преимущества:

✅ **Автоматическое кеширование** - данные сохраняются и переиспользуются  
✅ **Фоновые обновления** - данные синхронизируются автоматически  
✅ **Optimistic updates** - UI обновляется мгновенно  
✅ **Индикаторы загрузки** - из коробки isLoading, error, data  
✅ **Дедупликация запросов** - несколько вызовов = один запрос  
✅ **Ретраи и восстановление** - автоматические повторы при ошибках  

---

## 📦 Установка и настройка

### 1. Установлен пакет:
```bash
bun add @tanstack/react-query
```

### 2. Настроен QueryClient в `src/App.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // Данные актуальны 5 минут
      retry: 1,                         // 1 повтор при ошибке
      refetchOnWindowFocus: false,      // Не обновлять при фокусе
    },
  },
});

<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <App />
  </AuthProvider>
</QueryClientProvider>
```

---

## 🎣 Custom Hooks

### 📁 `src/hooks/useObjects.ts`

#### **useObjects** - получение списка объектов

```typescript
import { useObjects } from '@/hooks/useObjects';

function ObjectsPage() {
  const { data: objects = [], isLoading, error } = useObjects({ 
    status: 'available' 
  });
  
  if (isLoading) return <Loader />;
  if (error) return <Error message={error} />;
  
  return <ObjectsList objects={objects} />;
}
```

**Кеширование:** Данные хранятся 5 минут, затем помечаются как устаревшие.

---

#### **useObject** - получение одного объекта

```typescript
import { useObject } from '@/hooks/useObjects';

function ObjectDetail({ id }) {
  const { data: object, isLoading } = useObject(id);
  
  if (isLoading) return <Loader />;
  
  return <ObjectCard object={object} />;
}
```

**Особенности:** `enabled: !!id` - запрос выполняется только если id существует.

---

#### **useUpdateObject** - обновление объекта

```typescript
import { useUpdateObject } from '@/hooks/useObjects';

function BrokerDashboard() {
  const updateObject = useUpdateObject();
  
  const handleStatusChange = async (id: number, status: string) => {
    await updateObject.mutateAsync({ 
      id, 
      updates: { status } 
    });
  };
  
  return (
    <Button 
      onClick={() => handleStatusChange(123, 'sold')}
      disabled={updateObject.isPending}
    >
      {updateObject.isPending ? 'Обновление...' : 'Продано'}
    </Button>
  );
}
```

**Автоматика:**
- После успешного обновления инвалидируются кеши `['objects']` и `['object', id]`
- Все компоненты автоматически ре-рендерятся с новыми данными

---

#### **useCreateObject** - создание объекта

```typescript
const createObject = useCreateObject();

const handleCreate = async (data) => {
  await createObject.mutateAsync({
    title: 'Новый объект',
    city: 'Москва',
    property_type: 'apartments',
    price: 5000000,
    yield_percent: 12,
    payback_years: 7,
    status: 'available'
  });
};
```

---

#### **useDeleteObject** - удаление объекта

```typescript
const deleteObject = useDeleteObject();

const handleDelete = async (id: number) => {
  if (confirm('Удалить объект?')) {
    await deleteObject.mutateAsync(id);
  }
};
```

---

### 📁 `src/hooks/useFavorites.ts`

#### **useFavorites** - получение избранного

```typescript
import { useFavorites } from '@/hooks/useFavorites';

function FavoritesPage() {
  const { data: favorites = [] } = useFavorites();
  
  return (
    <div>
      {favorites.map(id => (
        <ObjectCard key={id} objectId={id} />
      ))}
    </div>
  );
}
```

**Зависимость:** Работает только если пользователь авторизован (`enabled: !!user`).

---

#### **useAddToFavorites** - добавить в избранное с Optimistic Update

```typescript
import { useAddToFavorites } from '@/hooks/useFavorites';

function ObjectCard({ objectId }) {
  const addToFavorites = useAddToFavorites();
  
  const handleAdd = async () => {
    await addToFavorites.mutateAsync(objectId);
  };
  
  return (
    <Button 
      onClick={handleAdd}
      disabled={addToFavorites.isPending}
    >
      <Heart />
    </Button>
  );
}
```

**Optimistic Update:**
1. UI обновляется **мгновенно** (сердечко становится красным)
2. Запрос идет на сервер в фоне
3. Если ошибка - UI откатывается к старому состоянию
4. Если успех - изменения остаются

---

#### **useRemoveFromFavorites** - удалить из избранного

```typescript
const removeFromFavorites = useRemoveFromFavorites();

const handleRemove = async () => {
  await removeFromFavorites.mutateAsync(objectId);
};
```

**Optimistic Update:** Аналогично добавлению, но в обратную сторону.

---

## 🚀 Оптимистичные обновления (Optimistic Updates)

### Что это?

UI обновляется **до** того, как сервер подтвердит изменение. Пользователь видит мгновенный результат.

### Пример из `useFavorites.ts`:

```typescript
export const useAddToFavorites = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (objectId: number) => {
      return await api.addToFavorites(user.id, objectId);
    },
    
    // 1. Мгновенно обновляем UI
    onMutate: async (objectId) => {
      // Отменяем текущие запросы, чтобы не перезаписали наши изменения
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });

      // Сохраняем текущее состояние для отката
      const previousFavorites = queryClient.getQueryData(['favorites', user?.id]);

      // Обновляем кеш мгновенно
      queryClient.setQueryData(['favorites', user?.id], (old = []) => 
        [...old, objectId]
      );

      return { previousFavorites }; // Для rollback
    },
    
    // 2. Если ошибка - откатываем изменения
    onError: (err, objectId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', user?.id], context.previousFavorites);
      }
    },
    
    // 3. После завершения - синхронизируем с сервером
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });
};
```

### Как это выглядит для пользователя:

| Без Optimistic | С Optimistic |
|----------------|--------------|
| Клик → Ждём → Иконка меняется (500мс) | Клик → Иконка меняется мгновенно ✨ |

---

## 🔄 Инвалидация кеша

### Что это?

**Инвалидация** = пометить данные как устаревшие и запросить свежие.

### Примеры:

```typescript
// После обновления объекта
onSuccess: (data, variables) => {
  // Инвалидируем список всех объектов
  queryClient.invalidateQueries({ queryKey: ['objects'] });
  
  // Инвалидируем конкретный объект
  queryClient.invalidateQueries({ queryKey: ['object', variables.id] });
}
```

**Результат:** Все компоненты, использующие эти данные, автоматически обновятся.

---

## 📊 Query Keys (ключи запросов)

### Зачем нужны?

React Query использует ключи для:
- Кеширования данных
- Инвалидации
- Дедупликации запросов

### Наши ключи:

| Ключ | Данные | Пример |
|------|--------|--------|
| `['objects']` | Все объекты | `useObjects()` |
| `['objects', filters]` | Фильтрованные объекты | `useObjects({ city: 'Москва' })` |
| `['object', id]` | Один объект | `useObject(123)` |
| `['favorites', userId]` | Избранное пользователя | `useFavorites()` |

### Правила:

```typescript
// ✅ Правильно - массив
queryKey: ['objects', { status: 'available' }]

// ❌ Неправильно - строка
queryKey: 'objects'
```

---

## 🎨 UI паттерны с React Query

### 1. Загрузка данных

```typescript
function ObjectsPage() {
  const { data, isLoading, error } = useObjects();
  
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="animate-spin" />
        <p>Загрузка...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="text-destructive" />
        <p>{error.message}</p>
        <Button onClick={() => refetch()}>Попробовать снова</Button>
      </div>
    );
  }
  
  return <ObjectsList objects={data} />;
}
```

---

### 2. Мутации с индикаторами

```typescript
function UpdateButton({ id }) {
  const updateObject = useUpdateObject();
  
  return (
    <Button 
      onClick={() => updateObject.mutate({ id, updates: {...} })}
      disabled={updateObject.isPending}
    >
      {updateObject.isPending ? (
        <>
          <Loader2 className="animate-spin mr-2" />
          Обновление...
        </>
      ) : (
        'Обновить'
      )}
    </Button>
  );
}
```

---

### 3. Зависимые запросы

```typescript
function ObjectWithBroker({ objectId }) {
  const { data: object } = useObject(objectId);
  
  // Запрос брокера выполнится только после загрузки объекта
  const { data: broker } = useBroker(object?.brokerId, {
    enabled: !!object?.brokerId
  });
  
  return <ObjectCard object={object} broker={broker} />;
}
```

---

## 🔧 Отладка

### 1. DevTools (опционально)

```bash
bun add @tanstack/react-query-devtools
```

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### 2. Логирование

```typescript
const { data, isLoading } = useObjects();

console.log('📊 Objects query:', {
  data,
  isLoading,
  cacheTime: queryClient.getQueryState(['objects'])?.dataUpdatedAt
});
```

---

## 📈 Производительность

### До React Query:

```typescript
// Каждый компонент делает свой запрос
<ObjectCard id={1} />  // → GET /objects/1
<ObjectCard id={1} />  // → GET /objects/1 (дубликат!)
<ObjectCard id={1} />  // → GET /objects/1 (дубликат!)
```

**Результат:** 3 запроса на сервер.

---

### С React Query:

```typescript
<ObjectCard id={1} />  // → GET /objects/1
<ObjectCard id={1} />  // → из кеша ✅
<ObjectCard id={1} />  // → из кеша ✅
```

**Результат:** 1 запрос, остальное из кеша.

---

## 🎯 Best Practices

### 1. Используйте custom hooks

```typescript
// ✅ Правильно
const { data } = useObjects();

// ❌ Неправильно - не переиспользуется
const { data } = useQuery({
  queryKey: ['objects'],
  queryFn: () => api.getObjects()
});
```

---

### 2. Правильно обрабатывайте ошибки

```typescript
const { data, error, isError } = useObjects();

if (isError) {
  toast.error(error.message);
  logError(error); // Отправить в Sentry
}
```

---

### 3. Используйте Optimistic Updates для UX

```typescript
// Мутации с мгновенным feedback
const addToFavorites = useAddToFavorites();

// UI обновится сразу, даже если сеть медленная
onClick={() => addToFavorites.mutate(id)}
```

---

### 4. Настройте staleTime правильно

```typescript
// Часто меняющиеся данные
staleTime: 1 * 60 * 1000  // 1 минута

// Редко меняющиеся данные
staleTime: 60 * 60 * 1000  // 1 час

// Статичные данные
staleTime: Infinity
```

---

## 🚀 Миграция компонентов

### До (useState + useEffect):

```typescript
function ObjectsPage() {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadObjects = async () => {
      try {
        setLoading(true);
        const data = await api.getObjects();
        setObjects(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadObjects();
  }, []);
  
  // ...
}
```

**Проблемы:**
- Много boilerplate кода
- Нет кеширования
- Дублирующие запросы
- Нужно вручную обрабатывать ошибки

---

### После (React Query):

```typescript
function ObjectsPage() {
  const { data: objects = [], isLoading, error } = useObjects();
  
  // Всё! 🎉
}
```

**Преимущества:**
- Минимум кода
- Автоматическое кеширование
- Нет дублирующих запросов
- Обработка ошибок из коробки

---

## 📚 Дополнительные ресурсы

- [Официальная документация](https://tanstack.com/query/latest)
- [Примеры](https://tanstack.com/query/latest/docs/framework/react/examples/simple)
- [Видео гайд](https://www.youtube.com/watch?v=novnyCaa7To)

---

## ✅ Checklist

Проверьте, что вы:

- [x] Установили `@tanstack/react-query`
- [x] Настроили `QueryClientProvider` в App.tsx
- [x] Создали custom hooks (useObjects, useFavorites)
- [x] Мигрировали компоненты на React Query
- [x] Добавили Optimistic Updates для лучшего UX
- [x] Используете индикаторы загрузки (isLoading, isPending)
- [x] Обрабатываете ошибки (error, isError)

---

**Готово!** 🚀 Теперь ваше приложение использует современный подход к управлению серверным состоянием.
