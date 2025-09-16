export function Select({ value, onChange, className = '', children, ...props }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        w-full px-3 py-2 border border-gray-300 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        bg-white text-gray-900 shadow-sm
        transition-colors duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  );
}