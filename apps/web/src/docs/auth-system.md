# Authentication System

這個認證系統使用 React Context 和 TanStack Query 來保護 dashboard 和其子路由。

## 架構概覽

```
Root Layout (QueryProvider)
└── Dashboard Layout (AuthProvider + AuthGuard)
    └── Dashboard Pages (受保護的路由)
```

## 核心組件

### 1. AuthProvider (`/contexts/auth-context.tsx`)
- 使用 `useAuth` hook 獲取認證狀態
- 提供全局認證狀態給子組件
- 自動重定向未認證用戶到登入頁面

### 2. AuthGuard (`/components/auth-guard.tsx`)
- 保護路由的組件
- 處理 loading、error 和未認證狀態
- 只有認證用戶才能看到子組件

### 3. QueryProvider (`/providers/query-provider.tsx`)
- TanStack Query 的全局配置
- 包含 React Query DevTools

## 使用方式

### 保護整個 Dashboard
在 `app/dashboard/layout.tsx` 中：

```tsx
import { AuthProvider } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </AuthProvider>
  );
}
```

### 在組件中使用認證狀態

```tsx
import { useAuthContext } from "@/hooks";

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not authenticated</div>;
  
  return <div>Hello, {user.name}!</div>;
}
```

### 保護特定組件

```tsx
import { AuthGuard } from "@/components/auth-guard";

function ProtectedComponent() {
  return (
    <AuthGuard fallback={<div>Please sign in</div>}>
      <div>This content is protected</div>
    </AuthGuard>
  );
}
```

## 自動重定向

- 未認證用戶會自動重定向到 `/sign-in`
- 認證成功後會重定向到 `/dashboard`

## 錯誤處理

- 網路錯誤：顯示錯誤訊息和重試按鈕
- 401/403 錯誤：不會重試，直接重定向到登入頁面
- Loading 狀態：顯示 loading spinner

## 可用的 Hooks

- `useAuth()`: 原始的 TanStack Query hook
- `useAuthContext()`: 從 Context 獲取認證狀態
- `useBrokers()`, `useOrders()` 等: 其他業務邏輯 hooks

## 路由結構

```
/sign-in (公開)
/dashboard (受保護)
├── /dashboard/brokers (受保護)
├── /dashboard/orders (受保護)
└── /dashboard/settings (受保護)
```

所有 `/dashboard/*` 路由都會自動受到保護。 