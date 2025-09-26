import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

// Cores predefinidas para gráficos financeiros
const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet  
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#84cc16", // Lime
  "#f97316", // Orange
  "#6366f1", // Blue
  "#8b5cf6", // Purple
  "#14b8a6", // Teal
  "#f43f5e", // Rose
  "#22c55e", // Green
  "#eab308", // Yellow
  "#3b82f6", // Blue-500
];

export const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ value, onChange, className, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [customColor, setCustomColor] = React.useState(value);

    React.useEffect(() => {
      setCustomColor(value);
    }, [value]);

    const handlePresetColorClick = (color: string) => {
      onChange(color);
      setCustomColor(color);
      setIsOpen(false);
    };

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setCustomColor(newColor);
      onChange(newColor);
    };

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className="h-10 w-20 p-1 border-2 border-input hover:border-ring"
              style={{ backgroundColor: value }}
            >
              <div className="w-full h-full rounded-sm border border-background/20" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="start">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Cores sugeridas</Label>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {PRESET_COLORS.map((color, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-6 h-6 rounded-sm border-2 transition-all hover:scale-110",
                        value === color ? "border-ring ring-2 ring-ring ring-offset-2" : "border-border"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => handlePresetColorClick(color)}
                      type="button"
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cor personalizada</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="w-12 h-10 p-1 cursor-pointer"
                    ref={ref}
                    {...props}
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    placeholder="#6366f1"
                    className="text-sm font-mono"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/50 border border-dashed border-muted-foreground/25">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Palette className="h-4 w-4" />
                  <span style={{ color: value }}>Preview da cor nos gráficos</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";