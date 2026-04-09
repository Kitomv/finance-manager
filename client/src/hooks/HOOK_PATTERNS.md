/**
 * Standard Hook Pattern for Finance Manager
 * 
 * This file demonstrates the recommended pattern for creating custom hooks
 * that use tRPC queries and mutations with proper error handling and notifications.
 */

import { useState, useEffect } from 'react';
import { TRPCClientError } from '@trpc/client';
import { useNotification } from '@/contexts/NotificationContext';

/**
 * Helper to convert tRPC errors to user-friendly messages
 */
export function getErrorMessage(error: unknown, context: string = 'operation'): string {
  if (error instanceof TRPCClientError) {
    // Check for Zod validation errors first
    const zodErrors = error.data?.zodError?.fieldErrors;
    if (zodErrors) {
      const firstError = Object.values(zodErrors)[0]?.[0];
      if (firstError) return firstError;
    }

    // Map tRPC error codes to messages
    const errorMessages: Record<string, string> = {
      'UNAUTHORIZED': 'Anda perlu login terlebih dahulu',
      'FORBIDDEN': 'Anda tidak memiliki izin untuk melakukan ini',
      'BAD_REQUEST': 'Data tidak valid. Periksa kembali input Anda',
      'NOT_FOUND': 'Data tidak ditemukan',
      'CONFLICT': 'Konflik data. Silakan refresh dan coba lagi',
      'INTERNAL_SERVER_ERROR': 'Terjadi kesalahan pada server',
      'TOO_MANY_REQUESTS': 'Terlalu banyak permintaan. Tunggu beberapa saat',
      'PARSE_ERROR': 'Kesalahan parsing data',
      'UNPROCESSABLE_CONTENT': 'Konten tidak dapat diproses',
    };

    const code = error.data?.code;
    return errorMessages[code] || error.message || `Gagal menjalankan ${context}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return `Gagal menjalankan ${context}`;
}

/**
 * Template for creating a query hook (read-only data)
 * 
 * @example
 * export function useMyData() {
 *   const { data, isLoading, error } = trpc.myRoute.list.useQuery(
 *     { page: 1, limit: 20 },
 *     {
 *       staleTime: 1000 * 60 * 5,      // 5 minutes
 *       gcTime: 1000 * 60 * 10,         // 10 minutes
 *       refetchOnWindowFocus: false,
 *     }
 *   );
 *
 *   return {
 *     data: data?.data || [],
 *     pagination: data?.pagination,
 *     isLoading,
 *     error,
 *   };
 * }
 */

/**
 * Template for creating a mutation hook (write operations)
 */
export function createMutationHook(
  mutation: any,
  {
    successTitle,
    successMessage,
    errorTitle,
    errorContext,
    onSuccessCallback,
    onErrorCallback,
  }: {
    successTitle: string;
    successMessage: (data: any) => string;
    errorTitle: string;
    errorContext: string;
    onSuccessCallback?: (data: any) => void;
    onErrorCallback?: (error: any) => void;
  }
) {
  const { addNotification } = useNotification();

  return {
    ...mutation,
    mutateWithNotification: async (input: any) => {
      try {
        const result = await mutation.mutateAsync(input);
        addNotification({
          type: 'success',
          title: successTitle,
          message: successMessage(result),
          duration: 5000,
        });
        onSuccessCallback?.(result);
        return result;
      } catch (error) {
        const errorMsg = getErrorMessage(error, errorContext);
        addNotification({
          type: 'error',
          title: errorTitle,
          message: errorMsg,
          duration: 6000,
        });
        onErrorCallback?.(error);
        throw error;
      }
    },
  };
}

/**
 * RECOMMENDED PATTERN: Use tRPC data directly without useState duplication
 * 
 * ❌ AVOID:
 * ```typescript
 * export function useMyData() {
 *   const [data, setData] = useState([]);
 *   const { data: trpcData } = trpc.list.useQuery();
 *   
 *   useEffect(() => {
 *     if (trpcData) setData(trpcData);
 *   }, [trpcData]);
 *   
 *   return { data };
 * }
 * ```
 * 
 * ✅ PREFER:
 * ```typescript
 * export function useMyData() {
 *   const { data: response, isLoading, error } = trpc.list.useQuery(
 *     { page: 1, limit: 20 },
 *     { staleTime: 5 * 60 * 1000 }
 *   );
 *   
 *   return {
 *     data: response?.data || [],
 *     pagination: response?.pagination,
 *     isLoading,
 *     error,
 *   };
 * }
 * ```
 */

/**
 * RECOMMENDED PATTERN: Configure mutations with callbacks
 * 
 * ✅ GOOD:
 * ```typescript
 * const createMutation = trpc.items.create.useMutation({
 *   onSuccess: (data, variables, context) => {
 *     refetch();
 *     notify('Created successfully');
 *   },
 *   onError: (error) => {
 *     notify('Failed to create', { type: 'error' });
 *   },
 * });
 * ```
 */

/**
 * RECOMMENDED PATTERNS FOR DIFFERENT SCENARIOS
 */

/**
 * Pattern 1: Simple Read-Only Data
 * Use when you just need to read and display data
 */
export function readOnlyQueryPattern() {
  return `
export function useTodos() {
  const { data: response, isLoading, error } = trpc.todos.list.useQuery(
    { page: 1, limit: 20 },
    {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    }
  );

  return {
    todos: response?.data || [],
    pagination: response?.pagination,
    isLoading,
    error,
    isEmpty: !isLoading && response?.data?.length === 0,
  };
}
`;
}

/**
 * Pattern 2: CRUD Operations with Error Handling
 * Use when you need to create/read/update/delete
 */
export function crudOperationsPattern() {
  return `
export function useTodos() {
  const { addNotification } = useNotification();
  
  // Read
  const { data: response, isLoading, refetch } = trpc.todos.list.useQuery(
    { page: 1, limit: 20 },
    { staleTime: 5 * 60 * 1000 }
  );

  // Create
  const createMutation = trpc.todos.create.useMutation({
    onSuccess: (data) => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Todo Created',
        message: \`"\${data.title}" has been created\`,
      });
    },
    onError: (error) => {
      const msg = getErrorMessage(error, 'create todo');
      addNotification({
        type: 'error',
        title: 'Failed to Create Todo',
        message: msg,
      });
    },
  });

  // Update
  const updateMutation = trpc.todos.update.useMutation({
    onSuccess: () => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Todo Updated',
        message: 'Changes have been saved',
      });
    },
    onError: (error) => {
      const msg = getErrorMessage(error, 'update todo');
      addNotification({
        type: 'error',
        title: 'Failed to Update Todo',
        message: msg,
      });
    },
  });

  // Delete
  const deleteMutation = trpc.todos.delete.useMutation({
    onSuccess: () => {
      refetch();
      addNotification({
        type: 'success',
        title: 'Todo Deleted',
        message: 'Todo has been removed',
      });
    },
    onError: (error) => {
      const msg = getErrorMessage(error, 'delete todo');
      addNotification({
        type: 'error',
        title: 'Failed to Delete Todo',
        message: msg,
      });
    },
  });

  return {
    // Query data
    todos: response?.data || [],
    pagination: response?.pagination,
    isLoading,
    
    // Mutation operations
    createTodo: createMutation.mutateAsync,
    updateTodo: updateMutation.mutateAsync,
    deleteTodo: deleteMutation.mutateAsync,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Error states
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
`;
}

/**
 * Pattern 3: Filtered Queries with Pagination
 * Use when you need to filter and paginate data
 */
export function filteredQueryPattern() {
  return `
export function useTodos(page = 1, filter?: { status?: string; category?: string }) {
  const { data: response, isLoading, refetch } = trpc.todos.list.useQuery(
    {
      page,
      limit: 20,
      status: filter?.status,
      category: filter?.category,
    },
    { staleTime: 5 * 60 * 1000 }
  );

  return {
    todos: response?.data || [],
    pagination: response?.pagination,
    isLoading,
    refetch,
  };
}
`;
}

/**
 * KEY PRINCIPLES
 * 
 * 1. DON'T duplicate state: Use tRPC data directly, don't useState again
 * 2. DO use cache settings: Configure staleTime and gcTime appropriately
 * 3. DO handle errors: Provide user-friendly error messages
 * 4. DO refetch on mutation: Invalidate queries when data changes
 * 5. DO expose loading states: Let components show loading indicators
 * 6. DO use notifications: Toast errors and successes to users
 */
