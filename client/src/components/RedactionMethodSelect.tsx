
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Method {
  id: string;
  title: string;
  description: string;
}

interface RedactionMethodSelectProps {
  selected: string;
  onSelect: (method: string) => void;
}

const methods: Method[] = [
  {
    id: 'full_redact',
    title: 'Full Redaction',
    description: 'Completely remove sensitive text from the document'
  },
  {
    id: 'obfuscate',
    title: 'Black Box',
    description: 'Cover sensitive information with black rectangles'
  },
  {
    id: 'replace',
    title: 'Text Replacement',
    description: 'Replace sensitive text with custom placeholder text'
  }
];

const RedactionMethodSelect = ({ selected, onSelect }: RedactionMethodSelectProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {methods.map((method) => (
        <button
          key={method.id}
          onClick={() => onSelect(method.id)}
          className={cn(
            "relative rounded-lg border-2 p-4 text-left transition-all",
            "hover:border-primary/20 hover:bg-muted",
            selected === method.id
              ? "border-primary bg-muted"
              : "border-border"
          )}
        >
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{method.title}</h3>
            <p className="text-sm text-muted-foreground">{method.description}</p>
          </div>
          {selected === method.id && (
            <div className="absolute right-4 top-4">
              <Check className="h-5 w-5 text-primary" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default RedactionMethodSelect;
