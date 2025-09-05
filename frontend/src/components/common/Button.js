import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '../../styles/theme';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false,
  style,
  ...props 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48
  },
  primary: {
    backgroundColor: THEME.colors.primary
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.secondary
  },
  disabled: {
    opacity: 0.6
  },
  text: {
    fontSize: THEME.fontSize.medium,
    fontWeight: '600'
  },
  primaryText: {
    color: THEME.colors.white
  },
  secondaryText: {
    color: THEME.colors.secondary
  }
});