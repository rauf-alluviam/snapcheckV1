import React, { useState, useEffect } from 'react';
import Select from './Select';
import Input from './Input';
import api from '../../utils/api';

interface CategorySelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  label = "Category",
  value,
  onChange,
  error,
  required = false
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Standard categories that are always available
  const standardCategories = ['Cargo', 'Facility', 'Vehicle', 'Safety', 'Quality', 'Damage'];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/workflows/categories');
        
        // Combine standard categories with existing categories from the database
        const existingCategories = response.data || [];
        const allCategories = Array.from(
          new Set([...standardCategories, ...existingCategories])
        ).sort();
        
        setCategories(allCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Fallback to standard categories if API fails
        setCategories(standardCategories);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Check if current value is a custom category (not in standard categories)
  useEffect(() => {
    if (value && !categories.includes(value) && value !== 'Other') {
      setShowCustomInput(true);
      setCustomCategory(value);
    } else if (value === 'Other') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomCategory('');
    }
  }, [value, categories]);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'Other') {
      setShowCustomInput(true);
      setCustomCategory('');
      onChange(''); // Clear the value until user enters custom category
    } else {
      setShowCustomInput(false);
      setCustomCategory('');
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (customValue: string) => {
    setCustomCategory(customValue);
    onChange(customValue);
  };

  // Prepare options for the select
  const selectOptions = [
    ...categories.map(cat => ({ value: cat, label: cat })),
    { value: 'Other', label: 'Other (Custom)' }
  ];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Select
        label={label}
        options={selectOptions}
        value={showCustomInput ? 'Other' : value}
        onChange={(e) => handleSelectChange(e.target.value)}
        error={!showCustomInput ? error : undefined}
        required={required}
      />
      
      {showCustomInput && (
        <Input
          label="Custom Category"
          placeholder="Enter your custom category name..."
          value={customCategory}
          onChange={(e) => handleCustomInputChange(e.target.value)}
          error={error}
          required={required}
        />
      )}
    </div>
  );
};

export default CategorySelect;
