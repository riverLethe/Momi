import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Image, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Text, XStack, YStack, Circle } from 'tamagui';
import { ArrowLeft, Calendar, Tag, X, Camera, Check } from 'lucide-react-native';

// Category options
const categories = [
  { id: '1', name: 'Food & Drinks', color: '#4CAF50' },
  { id: '2', name: 'Shopping', color: '#2196F3' },
  { id: '3', name: 'Transportation', color: '#FF9800' },
  { id: '4', name: 'Entertainment', color: '#E91E63' },
  { id: '5', name: 'Housing', color: '#9C27B0' },
  { id: '6', name: 'Health', color: '#00BCD4' },
  { id: '7', name: 'Travel', color: '#795548' },
  { id: '8', name: 'Education', color: '#607D8B' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    // Logic to save expense
    console.log({
      amount,
      description,
      category: selectedCategory,
      date
    });
    
    // Navigate back
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Custom header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <TouchableOpacity onPress={handleSave}>
            <Check size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView}>
          {/* Amount input */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>¥</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor="#AAAAAA"
            />
          </View>
          
          {/* Description input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Description (e.g., Lunch at Restaurant)"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#AAAAAA"
            />
          </View>
          
          {/* Date picker */}
          <TouchableOpacity style={styles.dateContainer}>
            <Calendar size={20} color="#4CAF50" />
            <Text style={styles.dateText}>{date}</Text>
          </TouchableOpacity>
          
          {/* Category selection */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && {
                    borderColor: category.color,
                    backgroundColor: `${category.color}10`,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Circle size={16} backgroundColor={category.color} />
                <Text style={styles.categoryText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Add receipt button */}
          <TouchableOpacity style={styles.addReceiptButton}>
            <Camera size={20} color="#4CAF50" />
            <Text style={styles.addReceiptText}>Add Receipt</Text>
          </TouchableOpacity>
        </ScrollView>
        
        {/* Bottom button */}
        <View style={styles.bottomContainer}>
          <Button
            style={styles.saveButton}
            backgroundColor="#4CAF50"
            pressStyle={{ opacity: 0.8 }}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Expense</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    minWidth: 150,
  },
  inputContainer: {
    marginBottom: 16,
  },
  descriptionInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    color: '#333333',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 24,
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333333',
  },
  addReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F0FFF0',
    borderRadius: 12,
    marginBottom: 24,
  },
  addReceiptText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  saveButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 