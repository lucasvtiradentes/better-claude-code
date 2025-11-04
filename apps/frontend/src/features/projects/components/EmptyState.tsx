interface EmptyStateProps {
  message: string;
  isError?: boolean;
}

export function EmptyState({ message, isError }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className={isError ? 'text-red-500' : 'text-muted-foreground text-sm'}>{message}</p>
    </div>
  );
}
