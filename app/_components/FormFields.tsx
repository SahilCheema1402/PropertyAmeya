import React from 'react';
import { Controller } from 'react-hook-form';

interface FormFieldProps {
  control: any;
  name: string;
  label: string;
  options?: Array<{ label: string; value: string }>;
  rules?: any;
  placeholder?: string;
}

export const SelectField: React.FC<FormFieldProps> = ({
  control,
  name,
  label,
  options = [],
  rules
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <select
          {...field}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    />
  </div>
);

export const InputField: React.FC<FormFieldProps> = ({
  control,
  name,
  label,
  placeholder = '',
  rules = {}
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <>
          <input
            type="text"
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
          {error && (
            <p className="text-red-500 text-xs mt-1">{error.message}</p>
          )}
        </>
      )}
    />
  </div>
);