import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { LucideIcon, Eye, EyeOff } from 'lucide-react-native';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  maxLength?: number;
  className?: string;
}

export const Input: React.FC<InputProps> = React.memo(({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconPress,
  maxLength,
  className = '',
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const showPasswordToggle = secureTextEntry;
  const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

  return (
    <View className={`${className}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {label}
        </Text>
      )}
      
      <View
        className={`
          flex-row items-center
          border rounded-lg px-3 py-3
          ${isFocused ? 'border-primary-500' : error ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100' : 'bg-white'}
          ${multiline ? 'items-start' : 'items-center'}
        `}
      >
        {LeftIcon && (
          <LeftIcon 
            size={20} 
            color={isFocused ? '#6366f1' : '#6b7280'} 
            className="mr-3"
          />
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          secureTextEntry={actualSecureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            flex-1 text-base text-gray-900
            ${multiline ? 'min-h-[80px] text-top' : ''}
          `}
        />
        
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            className="ml-3"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color="#6b7280" />
            ) : (
              <Eye size={20} color="#6b7280" />
            )}
          </TouchableOpacity>
        )}
        
        {RightIcon && !showPasswordToggle && (
          <TouchableOpacity
            onPress={onRightIconPress}
            className="ml-3"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RightIcon size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="text-sm text-red-500 mt-1">
          {error}
        </Text>
      )}
      
      {maxLength && (
        <Text className="text-xs text-gray-500 mt-1 text-right">
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input'; 