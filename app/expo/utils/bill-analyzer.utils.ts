import { EXPENSE_CATEGORIES } from '@/constants/categories';
import { BillInput } from '@/types/bills.types';

/**
 * 从文本描述中提取账单信息
 * 在实际应用中，这个函数可能会调用AI服务来进行更精确的提取
 */
export const extractBillDataFromText = (text: string): BillInput => {
  const lowerText = text.toLowerCase();
  
  // 提取金额
  const amountMatch = text.match(/(\d+(\.\d+)?)/);
  const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
  
  // 提取日期（如果有）
  const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/);
  let date = new Date();
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1; // 月份从0开始
    const year = dateMatch[3] ? 
      (parseInt(dateMatch[3], 10) < 100 ? 2000 + parseInt(dateMatch[3], 10) : parseInt(dateMatch[3], 10)) : 
      date.getFullYear();
    
    date = new Date(year, month, day);
    
    // 确保日期有效
    if (isNaN(date.getTime())) {
      date = new Date();
    }
  }
  
  // 提取类别
  let category = '';
  
  // 检查是否包含餐饮相关关键词
  if (
    lowerText.includes('餐') || 
    lowerText.includes('吃') || 
    lowerText.includes('饭') || 
    lowerText.includes('食') || 
    lowerText.includes('eat') || 
    lowerText.includes('food') || 
    lowerText.includes('meal') || 
    lowerText.includes('dinner') || 
    lowerText.includes('lunch') || 
    lowerText.includes('breakfast') ||
    lowerText.includes('咖啡') ||
    lowerText.includes('coffee')
  ) {
    category = 'food';
  }
  // 检查是否包含交通相关关键词
  else if (
    lowerText.includes('车') || 
    lowerText.includes('公交') || 
    lowerText.includes('地铁') || 
    lowerText.includes('taxi') || 
    lowerText.includes('uber') || 
    lowerText.includes('滴滴') || 
    lowerText.includes('bus') || 
    lowerText.includes('train') || 
    lowerText.includes('地铁') || 
    lowerText.includes('subway') ||
    lowerText.includes('transport')
  ) {
    category = 'transport';
  }
  // 检查是否包含购物相关关键词
  else if (
    lowerText.includes('买') || 
    lowerText.includes('购') || 
    lowerText.includes('商场') || 
    lowerText.includes('超市') || 
    lowerText.includes('buy') || 
    lowerText.includes('shop') || 
    lowerText.includes('mall') || 
    lowerText.includes('store') || 
    lowerText.includes('market') ||
    lowerText.includes('淘宝') ||
    lowerText.includes('taobao') ||
    lowerText.includes('jd') ||
    lowerText.includes('京东')
  ) {
    category = 'shopping';
  }
  // 检查是否包含娱乐相关关键词
  else if (
    lowerText.includes('玩') || 
    lowerText.includes('游戏') || 
    lowerText.includes('电影') || 
    lowerText.includes('电视') || 
    lowerText.includes('play') || 
    lowerText.includes('game') || 
    lowerText.includes('movie') || 
    lowerText.includes('tv') || 
    lowerText.includes('show') ||
    lowerText.includes('娱乐') ||
    lowerText.includes('entertainment')
  ) {
    category = 'entertainment';
  }
  // 检查是否包含水电煤相关关键词
  else if (
    lowerText.includes('水费') || 
    lowerText.includes('电费') || 
    lowerText.includes('煤气') || 
    lowerText.includes('水电') || 
    lowerText.includes('utility') || 
    lowerText.includes('water') || 
    lowerText.includes('electricity') || 
    lowerText.includes('gas')
  ) {
    category = 'utilities';
  }
  // 检查是否包含住房相关关键词
  else if (
    lowerText.includes('房') || 
    lowerText.includes('租') || 
    lowerText.includes('物业') || 
    lowerText.includes('house') || 
    lowerText.includes('rent') || 
    lowerText.includes('apartment') || 
    lowerText.includes('flat') ||
    lowerText.includes('住宿') ||
    lowerText.includes('酒店') ||
    lowerText.includes('hotel')
  ) {
    category = 'housing';
  }
  // 如果没有匹配到任何类别，使用默认类别
  else {
    category = 'other';
  }
  
  // 提取商户名称
  let merchant = '';
  
  // 尝试找到"在"、"于"、"at"后面的词作为商户名称
  const merchantMatch = text.match(/(?:在|于|at)\s+([^\s.,;，；。]+)/i);
  if (merchantMatch && merchantMatch[1]) {
    merchant = merchantMatch[1];
  }
  
  // 将提取的信息组合成账单数据
  return {
    amount,
    category,
    date,
    merchant,
    notes: text,
    account: '现金', // 默认账户
    isFamilyBill: false, // 默认为个人账单
  };
};

/**
 * 生成对账单分析结果的回复
 */
export const generateBillAnalysisResponse = (billData: BillInput): string => {
  const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.id === billData.category);
  const categoryName = categoryInfo ? categoryInfo.name : '其他';
  const formattedDate = billData.date.toLocaleDateString('zh-CN', { 
    month: 'long', 
    day: 'numeric' 
  });
  
  if (billData.amount <= 0) {
    return '我没有检测到有效的金额。请明确提供消费金额，例如"早餐花了20元"。';
  }
  
  let response = `我检测到一笔${categoryName}消费，金额为${billData.amount.toFixed(2)}元`;
  
  if (billData.merchant) {
    response += `，商家是${billData.merchant}`;
  }
  
  response += `，日期是${formattedDate}。这些信息是否正确？如需修改，请点击"保存账单"按钮进行编辑。`;
  
  return response;
}; 