import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Image, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Text, XStack, YStack, Circle } from 'tamagui';
import { ArrowLeft, Calendar, Tag, X, Camera, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuth } from '@/providers/AuthProvider';
import { useData } from '@/providers/DataProvider';
import { useViewStore } from '@/stores/viewStore';
import { saveBill, getBills, updateBill } from '@/utils/bills.utils';
import { EXPENSE_CATEGORIES } from '@/constants/categories';

export default function AddBillScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const billId = typeof params.id === 'string' ? params.id : '';
  const { refreshData } = useData();
  const { isAuthenticated, user } = useAuth();
  const { viewMode, currentFamilySpace } = useViewStore();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [account, setAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Load bill data if editing
  useEffect(() => {
    const loadBillData = async () => {
      if (!billId) return;
      
      try {
        const bills = await getBills();
        const bill = bills.find(b => b.id === billId);
        
        if (bill) {
          setIsEditing(true);
          setAmount(bill.amount.toString());
          setDescription(bill.merchant || '');
          setNotes(bill.notes || '');
          setAccount(bill.account || 'Cash');
          setSelectedCategory(bill.category);
          setSelectedDate(new Date(bill.date));
        }
      } catch (error) {
        console.error('Failed to load bill for editing:', error);
      }
    };
    
    loadBillData();
  }, [billId]);
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0 || !selectedCategory) {
      // 输入验证
      alert(t('Please enter a valid amount and select a category'));
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 构建账单数据
      const billData = {
        amount: parseFloat(amount),
        category: selectedCategory,
        date: selectedDate,
        merchant: description, // 使用描述作为商家名称
        notes: notes, // 备注
        account: account || 'Cash', // 账户
        isFamilyBill: viewMode === 'family',
        familyId: viewMode === 'family' ? currentFamilySpace?.id : undefined,
        familyName: viewMode === 'family' ? currentFamilySpace?.name : undefined,
      };
      
      if (isEditing && billId) {
        // 更新已有账单
        await updateBill(billId, billData);
      } else {
        // 保存新账单到本地存储
        const currentUser = user || { id: 'local-user', name: 'Local User' };
        await saveBill(billData, currentUser);
      }
      
      // 刷新数据提供者中的数据
      await refreshData();
      
      // 返回账单列表页面
      router.back();
    } catch (error) {
      console.error('Failed to save bill:', error);
      alert(t('Failed to save bill. Please try again.'));
    } finally {
      setIsSaving(false);
    }
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
          <Text style={styles.headerTitle}>{isEditing ? t('Edit Bill') : t('Add Bill')}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Check size={24} color={isSaving ? "#AAAAAA" : "#4CAF50"} />
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
              placeholder={t('Merchant (e.g., Restaurant Name)')}
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#AAAAAA"
            />
          </View>
          
          {/* Date picker */}
          <TouchableOpacity 
            style={styles.dateContainer} 
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color="#4CAF50" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
          
          {/* Notes input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.descriptionInput}
              placeholder={t('Notes (optional)')}
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor="#AAAAAA"
              multiline
            />
          </View>
          
          {/* Account input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.descriptionInput}
              placeholder={t('Payment Method (e.g., Cash, Card)')}
              value={account}
              onChangeText={setAccount}
              placeholderTextColor="#AAAAAA"
            />
          </View>
          
          {/* Category selection */}
          <Text style={styles.sectionTitle}>{t('Categories')}</Text>
          <View style={styles.categoriesContainer}>
            {EXPENSE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && {
                    borderColor: category.color,
                    backgroundColor: `${category.color}20`,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Circle size={16} backgroundColor={category.color} />
                <Text style={styles.categoryText}>{t(category.name)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Add receipt button */}
          <TouchableOpacity style={styles.addReceiptButton}>
            <Camera size={20} color="#4CAF50" />
            <Text style={styles.addReceiptText}>{t('Add Receipt')}</Text>
          </TouchableOpacity>
        </ScrollView>
        
        {/* Bottom button */}
        <View style={styles.bottomContainer}>
          <Button
            style={styles.saveButton}
            backgroundColor="#4CAF50"
            pressStyle={{ opacity: 0.8 }}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? t('Saving...') : isEditing ? t('Update Bill') : t('Save Bill')}
            </Text>
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