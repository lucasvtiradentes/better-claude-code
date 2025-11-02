import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SearchNavigationProps = {
  searchTerm: string;
  currentIndex: number;
  totalMatches: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
};

export const SearchNavigation = ({
  searchTerm,
  currentIndex,
  totalMatches,
  onNext,
  onPrevious,
  onClose
}: SearchNavigationProps) => {
  if (totalMatches === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-accent border-b border-border">
      <span className="text-sm">
        <span className="font-semibold">{searchTerm}</span>
        <span className="text-muted-foreground ml-2">
          {currentIndex + 1}/{totalMatches}
        </span>
      </span>
      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="sm" onClick={onPrevious} disabled={currentIndex === 0} className="h-7 w-7 p-0">
          <ChevronUp size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={currentIndex === totalMatches - 1}
          className="h-7 w-7 p-0"
        >
          <ChevronDown size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 ml-2">
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};
