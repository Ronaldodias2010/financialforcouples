import { useState, KeyboardEvent } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tag {
  id: string;
  name: string;
  color?: string;
  removable?: boolean;
}

interface TagInputProps {
  tags: Tag[];
  onAddTag: (tagName: string) => Promise<boolean> | boolean;
  onRemoveTag: (tagId: string) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
  suggestions?: string[];
}

export const TagInput = ({
  tags,
  onAddTag,
  onRemoveTag,
  placeholder = "Digite uma tag e pressione Enter...",
  className,
  maxTags,
  suggestions = []
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(suggestion => 
    suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
    !tags.some(tag => tag.name.toLowerCase() === suggestion.toLowerCase())
  );

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      await handleAddTag(inputValue.trim());
    }
  };

  const handleAddTag = async (tagName: string) => {
    if (!tagName.trim()) return;
    
    if (maxTags && tags.length >= maxTags) {
      return;
    }

    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      return;
    }

    const success = await onAddTag(tagName);
    if (success) {
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddTag(suggestion);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => setShowSuggestions(inputValue.length > 0)}
            placeholder={placeholder}
            className="pr-10"
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-background border border-border rounded-md mt-1 max-h-32 overflow-y-auto shadow-lg">
              {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddTag(inputValue.trim())}
          disabled={!inputValue.trim() || (maxTags && tags.length >= maxTags)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tags display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
              style={tag.color ? { backgroundColor: `${tag.color}20`, borderColor: tag.color } : {}}
            >
              <span>{tag.name}</span>
              {tag.removable !== false && (
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag.id)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {tags.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
};