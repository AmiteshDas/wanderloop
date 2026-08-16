const PRESETS = [15, 30, 45, 60];

interface DurationPickerProps {
  onPick: (minutes: number) => void;
  disabled?: boolean;
}

export function DurationPicker({ onPick, disabled }: DurationPickerProps) {
  return (
    <div className="duration-picker">
      <h2>How long do you want to walk?</h2>
      <div className="duration-picker__grid">
        {PRESETS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            className="duration-picker__button"
            disabled={disabled}
            onClick={() => onPick(minutes)}
          >
            {minutes}
            <span>min</span>
          </button>
        ))}
      </div>
    </div>
  );
}
