interface Props {
    value: string;
    onChange: (value: string) => void;
  }
  
  export default function SearchBar({ value, onChange }: Props) {
    return (
      <input
        type="text"
        placeholder="Search banners..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
    );
  }
  